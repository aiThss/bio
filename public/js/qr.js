/**
 * Zero-dependency pure JavaScript QR Code Generator (SVG & PNG)
 */
(function (global) {
  const MODE_8BIT_BYTE = 1 << 2;
  const ECL_L = 1;

  function QRPolynomial(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  QRPolynomial.prototype = {
    get: function (index) { return this.num[index]; },
    getLength: function () { return this.num.length; },
    multiply: function (e) {
      const num = new Array(this.getLength() + e.getLength() - 1);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.glog(this.get(i)) + QRMath.glog(e.get(j));
          num[i + j] = QRMath.gexp(num[i + j]);
        }
      }
      return new QRPolynomial(num, 0);
    },
    mod: function (e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      return new QRPolynomial(num, 0).mod(e);
    }
  };

  const QRMath = {
    glog: function (n) { return QRMath.LOG_TABLE[n]; },
    gexp: function (n) {
      while (n < 0) n += 255;
      while (n >= 256) n -= 255;
      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };
  for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

  const RS_BLOCK_TABLE = [
    [1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80], [1, 134, 108],
    [2, 86, 68], [2, 98, 78], [2, 121, 97], [2, 146, 116], [2, 174, 138]
  ];

  function QRCodeModel(typeNumber) {
    this.typeNumber = typeNumber;
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
  }

  QRCodeModel.prototype = {
    addData: function (data) {
      this.dataList.push({
        mode: MODE_8BIT_BYTE,
        data: data,
        getLength: function () { return this.data.length; },
        write: function (buffer) {
          for (let i = 0; i < this.data.length; i++) buffer.put(this.data.charCodeAt(i), 8);
        }
      });
    },
    make: function () {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount);
        for (let col = 0; col < this.moduleCount; col++) this.modules[row][col] = null;
      }
      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupTimingPattern();
      this.setupTypeInfo(false, 0);
      if (this.typeNumber >= 7) this.setupTypeNumber(false);
      const data = QRCodeModel.createData(this.typeNumber, this.dataList);
      this.mapData(data, 0);
    },
    setupPositionProbePattern: function (row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          if ((0 <= r && r <= 6 && (c === 0 || c === 6)) || (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    setupTimingPattern: function () {
      for (let r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] !== null) continue;
        this.modules[r][6] = (r % 2 === 0);
      }
      for (let c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] !== null) continue;
        this.modules[6][c] = (c % 2 === 0);
      }
    },
    setupTypeInfo: function (test, maskPattern) {
      const data = (ECL_L << 3) | maskPattern;
      const bits = QRUtil.getBCHTypeInfo(data);
      for (let i = 0; i < 15; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 6) this.modules[i][8] = mod;
        else if (i < 9) this.modules[i + 1][8] = mod;
        else this.modules[this.moduleCount - 15 + i][8] = mod;

        if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
        else if (i < 9) this.modules[8][15 - i] = mod;
        else this.modules[8][15 - i - 1] = mod;
      }
      this.modules[this.moduleCount - 8][8] = (!test);
    },
    setupTypeNumber: function (test) {
      const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
      for (let i = 0; i < 18; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
        this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    },
    mapData: function (data, maskPattern) {
      let inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
      for (let col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              let dark = false;
              if (byteIndex < data.length) dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
              const mask = QRUtil.getMask(maskPattern, row, col - c);
              if (mask) dark = !dark;
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break; }
        }
      }
    }
  };

  QRCodeModel.createData = function (typeNumber, dataList) {
    const rsBlock = RS_BLOCK_TABLE[typeNumber - 1];
    const buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), 8);
      data.write(buffer);
    }
    const totalDataCount = rsBlock[0] * rsBlock[2];
    if (buffer.getLengthInBits() > totalDataCount * 8) throw new Error("Data overflow");
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0xec, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    const dcdata = buffer.buffer;
    const rsPoly = QRUtil.getErrorCorrectPolynomial(rsBlock[1] - rsBlock[2]);
    const rawPoly = new QRPolynomial(dcdata, rsPoly.getLength() - 1);
    const modPoly = rawPoly.mod(rsPoly);
    const res = dcdata.slice(0);
    for (let i = 0; i < rsPoly.getLength() - 1; i++) {
      const modIndex = i + modPoly.getLength() - (rsPoly.getLength() - 1);
      res.push((modIndex >= 0) ? modPoly.get(modIndex) : 0);
    }
    return res;
  };

  const QRUtil = {
    getMask: function (maskPattern, i, j) {
      switch (maskPattern) {
        case 0: return (i + j) % 2 === 0;
        case 1: return i % 2 === 0;
        case 2: return j % 3 === 0;
        case 3: return (i + j) % 3 === 0;
        case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case 5: return (i * j) % 2 + (i * j) % 3 === 0;
        case 6: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
        case 7: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
        default: return false;
      }
    },
    getErrorCorrectPolynomial: function (errorCorrectLength) {
      let a = new QRPolynomial([1], 0);
      for (let i = 0; i < errorCorrectLength; i++) a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      return a;
    },
    getBCHTypeInfo: function (data) {
      let d = data << 10;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(0x537) >= 0) d ^= (0x537 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(0x537)));
      return ((data << 10) | d) ^ 0x5412;
    },
    getBCHTypeNumber: function (data) {
      let d = data << 12;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(0x1f25) >= 0) d ^= (0x1f25 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(0x1f25)));
      return (data << 12) | d;
    },
    getBCHDigit: function (data) {
      let digit = 0;
      while (data !== 0) { digit++; data >>>= 1; }
      return digit;
    }
  };

  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  QRBitBuffer.prototype = {
    get: function (index) { return ((this.buffer[Math.floor(index / 8)] >>> (7 - index % 8)) & 1) === 1; },
    put: function (num, length) { for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1); },
    getLengthInBits: function () { return this.length; },
    putBit: function (bit) {
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
    }
  };

  const BioQR = {
    generateSVG: function (text, options = {}) {
      const size = options.size || 220;
      const darkColor = options.darkColor || '#0a0a0f';
      const lightColor = options.lightColor || '#ffffff';
      const border = 3;

      let typeNum = 3;
      if (text.length > 32) typeNum = 4;
      if (text.length > 55) typeNum = 5;
      if (text.length > 80) typeNum = 6;
      if (text.length > 105) typeNum = 7;
      if (text.length > 140) typeNum = 9;

      const qr = new QRCodeModel(typeNum);
      qr.addData(text);
      qr.make();

      const count = qr.moduleCount;
      const totalSize = count + border * 2;

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">`;
      svg += `<rect width="${totalSize}" height="${totalSize}" fill="${lightColor}" rx="2"/>`;

      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.modules[r][c]) {
            svg += `<rect x="${c + border}" y="${r + border}" width="1" height="1" fill="${darkColor}"/>`;
          }
        }
      }
      svg += `</svg>`;
      return svg;
    }
  };

  global.BioQR = BioQR;
})(typeof window !== 'undefined' ? window : global);
