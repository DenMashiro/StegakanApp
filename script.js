    // DOM Elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imagePreview = document.getElementById('imagePreview');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const fileInfo = document.getElementById('fileInfo');
    const uploadProgress = document.getElementById('uploadProgress');
    const messageStatus = document.getElementById('messageStatus');
    const encryptionStatus = document.getElementById('encryptionStatus');
    const outputText = document.getElementById('outputText');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const downloadBtn = document.getElementById('downloadBtn');

    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
      });
    });

    // Update message length counter
    document.getElementById('messageInput').addEventListener('input', function() {
      const length = this.value.length;
      messageStatus.innerHTML = `<i class="fas fa-ruler-horizontal"></i> Panjang: ${length} karakter`;
    });

    // Update encryption status
    document.getElementById('passwordInput').addEventListener('input', function() {
      if (this.value.length > 0) {
        encryptionStatus.innerHTML = `<i class="fas fa-lock"></i> Enkripsi: Aktif (${this.value.length} karakter)`;
        encryptionStatus.classList.add('active');
      } else {
        encryptionStatus.innerHTML = `<i class="fas fa-lock-open"></i> Enkripsi: Tidak aktif`;
        encryptionStatus.classList.remove('active');
      }
    });

    // File upload handling
    document.getElementById('imageInput').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      // Update file info
      fileInfo.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name} (${formatFileSize(file.size)})`;
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        uploadProgress.style.width = `${progress}%`;
        if (progress >= 100) {
          clearInterval(interval);
          loadImage(file);
        }
      }, 50);
    });

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          previewPlaceholder.style.display = 'none';
          canvas.style.display = 'block';
          downloadBtn.disabled = false;
        };
        img.onerror = function() {
          showAlert('Gagal memuat gambar. Silakan coba file lain.', 'danger');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function showAlert(message, type) {
      const alertBox = document.createElement('div');
      alertBox.className = `alert alert-${type}`;
      alertBox.innerHTML = `
        <i class="fas fa-${type === 'danger' ? 'exclamation-circle' : 'check-circle'}"></i>
        <div>${message}</div>
      `;
      
      // Insert at the beginning of the right column
      const rightColumn = document.querySelector('.right-column');
      rightColumn.insertBefore(alertBox, rightColumn.firstChild);
      
      // Remove after 5 seconds
      setTimeout(() => {
        alertBox.remove();
      }, 5000);
    }

    // Fungsi DCT dan IDCT
    function applyDCT(matrix) {
      const N = matrix.length;
      const dctMatrix = new Array(N).fill(0).map(() => new Array(N).fill(0));
      
      for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
          let sum = 0;
          
          for (let x = 0; x < N; x++) {
            for (let y = 0; y < N; y++) {
              const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
              const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
              
              const cos1 = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));
              const cos2 = Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
              
              sum += matrix[x][y] * cu * cv * cos1 * cos2;
            }
          }
          
          dctMatrix[u][v] = (2 / N) * sum;
        }
      }
      
      return dctMatrix;
    }

    function applyIDCT(matrix) {
      const N = matrix.length;
      const idctMatrix = new Array(N).fill(0).map(() => new Array(N).fill(0));
      
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          let sum = 0;
          
          for (let u = 0; u < N; u++) {
            for (let v = 0; v < N; v++) {
              const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
              const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
              
              const cos1 = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));
              const cos2 = Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
              
              sum += cu * cv * matrix[u][v] * cos1 * cos2;
            }
          }
          
          idctMatrix[x][y] = Math.round((2 / N) * sum);
        }
      }
      
      return idctMatrix;
    }

    // Fungsi kuantisasi untuk kompresi JPEG
    const quantizationMatrix = [
      [16, 11, 10, 16, 24, 40, 51, 61],
      [12, 12, 14, 19, 26, 58, 60, 55],
      [14, 13, 16, 24, 40, 57, 69, 56],
      [14, 17, 22, 29, 51, 87, 80, 62],
      [18, 22, 37, 56, 68, 109, 103, 77],
      [24, 35, 55, 64, 81, 104, 113, 92],
      [49, 64, 78, 87, 103, 121, 120, 101],
      [72, 92, 95, 98, 112, 100, 103, 99]
    ];

    function quantize(matrix, quality = 50) {
      const N = matrix.length;
      const qMatrix = new Array(N).fill(0).map(() => new Array(N).fill(0));
      
      // Adjust quality (1-100)
      const scale = quality < 50 ? 5000 / quality : 200 - 2 * quality;
      
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const q = Math.floor((quantizationMatrix[i][j] * scale + 50) / 100);
          qMatrix[i][j] = Math.round(matrix[i][j] / Math.max(1, q));
        }
      }
      
      return qMatrix;
    }

    function dequantize(matrix, quality = 50) {
      const N = matrix.length;
      const dqMatrix = new Array(N).fill(0).map(() => new Array(N).fill(0));
      
      // Adjust quality (1-100)
      const scale = quality < 50 ? 5000 / quality : 200 - 2 * quality;
      
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const q = Math.floor((quantizationMatrix[i][j] * scale + 50) / 100);
          dqMatrix[i][j] = matrix[i][j] * Math.max(1, q);
        }
      }
      
      return dqMatrix;
    }

    // Fungsi enkripsi/dekripsi
    function encrypt(text, password) {
      if (!password) return text;
      return btoa([...text].map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ password.charCodeAt(i % password.length))
      ).join(''));
    }

    function decrypt(cipher, password) {
      if (!password) return cipher;
      try {
        return [...atob(cipher)].map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ password.charCodeAt(i % password.length))
        ).join('');
      } catch {
        return '[Dekripsi gagal. Password salah atau data rusak]';
      }
    }

    // Fungsi untuk membagi gambar menjadi blok 8x8 dengan mempertahankan warna
    function getImageBlocks(imageData, blockSize = 8) {
      const blocks = [];
      const {width, height, data} = imageData;
      
      for (let y = 0; y < height; y += blockSize) {
        for (let x = 0; x < width; x += blockSize) {
          const blockR = new Array(blockSize).fill(0).map(() => new Array(blockSize).fill(0));
          const blockG = new Array(blockSize).fill(0).map(() => new Array(blockSize).fill(0));
          const blockB = new Array(blockSize).fill(0).map(() => new Array(blockSize).fill(0));
          
          for (let i = 0; i < blockSize; i++) {
            for (let j = 0; j < blockSize; j++) {
              const px = x + j;
              const py = y + i;
              
              if (px < width && py < height) {
                const idx = (py * width + px) * 4;
                blockR[i][j] = data[idx];     // Red channel
                blockG[i][j] = data[idx + 1]; // Green channel
                blockB[i][j] = data[idx + 2]; // Blue channel (akan dimodifikasi)
              }
            }
          }
          
          blocks.push({x, y, blockR, blockG, blockB});
        }
      }
      
      return blocks;
    }

    // Fungsi untuk menyusun kembali blok menjadi gambar dengan warna
    function assembleImageBlocks(blocks, width, height, blockSize = 8) {
      const imageData = new Uint8ClampedArray(width * height * 4);
      
      for (const {x, y, blockR, blockG, blockB} of blocks) {
        for (let i = 0; i < blockSize; i++) {
          for (let j = 0; j < blockSize; j++) {
            const px = x + j;
            const py = y + i;
            
            if (px < width && py < height) {
              const idx = (py * width + px) * 4;
              imageData[idx] = Math.max(0, Math.min(255, blockR[i][j]));     // R
              imageData[idx + 1] = Math.max(0, Math.min(255, blockG[i][j])); // G
              imageData[idx + 2] = Math.max(0, Math.min(255, blockB[i][j]));  // B
              imageData[idx + 3] = 255; // Alpha
            }
          }
        }
      }
      
      return new ImageData(imageData, width, height);
    }

    // Fungsi untuk menyisipkan pesan dalam koefisien DCT dengan perubahan minimal
    function embedInDCT(dctMatrix, bit, strength = 1.5) {
      const u = 4, v = 3; // Koordinat frekuensi yang lebih tidak terlihat
      
      // Normalisasi koefisien sebelum modifikasi
      const coeff = dctMatrix[u][v];
      const sign = coeff >= 0 ? 1 : -1;
      const absCoeff = Math.abs(coeff);
      
      // Modifikasi minimal untuk mengurangi perubahan visual
      const newCoeff = bit === '1' ? 
        sign * Math.max(absCoeff, strength) : 
        sign * Math.min(absCoeff, strength);
      
      dctMatrix[u][v] = newCoeff;
      return dctMatrix;
    }

    // Fungsi untuk mengekstrak bit dari koefisien DCT
    function extractFromDCT(dctMatrix) {
      const u = 4, v = 3; // Harus sama dengan embedInDCT
      const coeff = dctMatrix[u][v];
      return coeff > 0 ? '1' : '0';
    }

    // Fungsi utama untuk menyisipkan pesan
    function embedMessage() {
      const file = document.getElementById('imageInput').files[0];
      let message = document.getElementById('messageInput').value;
      const password = document.getElementById('passwordInput').value;

      if (!file) {
        showAlert('Silakan pilih file gambar terlebih dahulu.', 'danger');
        return;
      }

      if (!message) {
        showAlert('Silakan masukkan pesan untuk disisipkan.', 'danger');
        return;
      }

      // Show processing indicator
      const originalButton = document.querySelector('.btn-success');
      const originalHtml = originalButton.innerHTML;
      originalButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Memproses...`;
      originalButton.disabled = true;

      // Encrypt the message
      message = encrypt(message, password);

      setTimeout(() => {
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // 1. Bagi gambar menjadi blok 8x8 (dengan warna)
          const blocks = getImageBlocks(imageData);
          
          // 2. Konversi pesan ke biner dengan terminator
          let messageBin = '';
          for (let i = 0; i < message.length; i++) {
            let bin = message[i].charCodeAt(0).toString(2).padStart(8, '0');
            messageBin += bin;
          }
          messageBin += '00000000'; // Null terminator
          
          // 3. Sisipkan pesan hanya dalam channel biru
          let bitIndex = 0;
          const modifiedBlocks = blocks.map(({x, y, blockR, blockG, blockB}) => {
            if (bitIndex >= messageBin.length) return {x, y, blockR, blockG, blockB};
            
            // 3a. Terapkan DCT hanya pada channel biru
            const dctMatrix = applyDCT(blockB);
            
            // 3b. Kuantisasi (dengan kualitas lebih tinggi)
            const quantized = quantize(dctMatrix, 85); // Meningkatkan dari 75 ke 85
            
            // 3c. Sisipkan bit pesan
            if (bitIndex < messageBin.length) {
              const bit = messageBin[bitIndex];
              embedInDCT(quantized, bit);
              bitIndex++;
            }
            
            // 3d. Dequantisasi
            const dequantized = dequantize(quantized, 85);
            
            // 3e. Terapkan IDCT untuk kembali ke domain spasial
            const idctMatrix = applyIDCT(dequantized);
            
            return {
              x, 
              y, 
              blockR, // Channel merah tidak diubah
              blockG, // Channel hijau tidak diubah
              blockB: idctMatrix // Hanya channel biru yang dimodifikasi
            };
          });
          
          // 4. Susun kembali blok menjadi gambar
          const newImageData = assembleImageBlocks(modifiedBlocks, canvas.width, canvas.height);
          
          // 5. Gambar hasil ke canvas
          ctx.putImageData(newImageData, 0, 0);
          
          showAlert(`Pesan berhasil disisipkan dalam ${bitIndex} blok DCT dengan perubahan warna minimal!`, 'success');
          outputText.textContent = 'Pesan tersisip. Perubahan warna hampir tidak terlihat oleh mata.';
        } catch (error) {
          showAlert('Error menyisipkan pesan: ' + error.message, 'danger');
          console.error(error);
        } finally {
          originalButton.innerHTML = originalHtml;
          originalButton.disabled = false;
        }
      }, 100);
    }

    // Fungsi utama untuk mengekstrak pesan
    function extractMessage() {
      const password = document.getElementById('passwordInput').value;

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 1. Bagi gambar menjadi blok 8x8 (hanya perlu channel biru)
        const blocks = getImageBlocks(imageData);
        
        // 2. Ekstrak bit dari blok DCT channel biru
        let binaryStr = '';
        let nullTerminatorCount = 0;
        
        for (const {blockB} of blocks) {
          // 2a. Terapkan DCT pada channel biru
          const dctMatrix = applyDCT(blockB);
          
          // 2b. Kuantisasi (harus sama dengan saat penyisipan)
          const quantized = quantize(dctMatrix, 85);
          
          // 2c. Ekstrak bit dari koefisien DCT
          const bit = extractFromDCT(quantized);
          binaryStr += bit;
          
          // 2d. Cek null terminator
          if (bit === '0') {
            nullTerminatorCount++;
            if (nullTerminatorCount >= 8 && binaryStr.length % 8 === 0) {
              const lastByte = binaryStr.slice(-8);
              if (lastByte === '00000000') break;
            }
          } else {
            nullTerminatorCount = 0;
          }
        }
        
        // 3. Konversi biner ke pesan
        let message = '';
        for (let i = 0; i < binaryStr.length - 8; i += 8) {
          const byte = binaryStr.slice(i, i + 8);
          message += String.fromCharCode(parseInt(byte, 2));
        }
        
        // 4. Decrypt jika menggunakan password
        const decrypted = decrypt(message, password);
        
        if (decrypted.length === 0) {
          outputText.textContent = 'Tidak ada pesan yang ditemukan atau ekstraksi gagal.';
        } else {
          outputText.textContent = decrypted;
          showAlert('Pesan berhasil diekstrak dari channel biru!', 'success');
        }
      } catch (error) {
        showAlert('Error mengekstrak pesan: ' + error.message, 'danger');
        console.error(error);
      }
    }

    // Fungsi untuk mengunduh gambar
    function downloadImage() {
      if (canvas.width === 0) {
        showAlert('Tidak ada gambar yang tersedia untuk diunduh.', 'danger');
        return;
      }

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `stego-image-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert('Gambar dengan pesan tersembunyi berhasil diunduh!', 'success');
    }

    // Initialize
    canvas.style.display = 'none';