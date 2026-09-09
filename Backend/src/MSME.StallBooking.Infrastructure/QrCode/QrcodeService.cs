using Microsoft.Extensions.Logging;
using MSME.StallBooking.Application.Contracts;
using QRCoder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MSME.StallBooking.Infrastructure.QrCode
{
    public sealed class QrCodeService : IQrCodeService
    {
        private readonly ILogger<QrCodeService> _logger;

        public QrCodeService(ILogger<QrCodeService> logger) => _logger = logger;

        public byte[] GenerateQrCode(string textToEncode)
        {
            if (string.IsNullOrWhiteSpace(textToEncode))
                throw new ArgumentException("Text to encode for the QR code is required.", nameof(textToEncode));

            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(textToEncode, QRCodeGenerator.ECCLevel.Q);
            var pngQrCode = new PngByteQRCode(qrCodeData);
            return pngQrCode.GetGraphic(20);
        }
    }
}
