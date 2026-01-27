<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }

        .content {
            padding: 40px;
        }

        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
        }

        .message {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }

        .warning {
            font-size: 14px;
            color: #e74c3c;
            line-height: 1.6;
            margin-bottom: 20px;
            padding: 12px;
            background-color: #fdf2f2;
            border-left: 4px solid #e74c3c;
            border-radius: 4px;
        }

        .button-container {
            text-align: center;
            margin: 30px 0;
        }

        .button {
            display: inline-block;
            padding: 12px 40px;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
        }

        .button:hover {
            opacity: 0.9;
            text-decoration: none;
        }

        .manual-link {
            background-color: #f5f5f5;
            border-left: 4px solid #e74c3c;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .manual-link p {
            font-size: 12px;
            color: #666;
            margin: 0 0 8px 0;
        }

        .manual-link code {
            font-size: 11px;
            color: #333;
            background: #fff;
            padding: 8px;
            display: block;
            border-radius: 4px;
            word-break: break-all;
            border: 1px solid #ddd;
        }

        .expiry-notice {
            font-size: 12px;
            color: #999;
            text-align: center;
            margin-top: 20px;
        }

        .footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }

        .footer p {
            margin: 5px 0;
        }

        .footer a {
            color: #e74c3c;
            text-decoration: none;
        }

        .security-notice {
            font-size: 12px;
            color: #666;
            background-color: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>

        <div class="content">
            <p class="greeting">Hello {{ $user->name }},</p>

            <p class="message">
                We received a request to reset the password for your ADORSS account associated with
                <strong>{{ $user->email }}</strong>.
            </p>

            <div class="warning">
                <strong>⚠️ Important:</strong> If you did not request a password reset, please ignore this email
                or contact our support team immediately. Your password will remain unchanged.
            </div>

            <p class="message">
                Click the button below to reset your password. This link will expire in
                <strong>{{ $expiresInMinutes }} minutes</strong>.
            </p>

            <div class="button-container">
                <a href="{{ $resetUrl }}" class="button">Reset My Password</a>
            </div>

            <div class="manual-link">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <code>{{ $resetUrl }}</code>
            </div>

            <p class="expiry-notice">
                ⏰ This link expires in {{ $expiresInMinutes }} minutes for your security.
            </p>

            <div class="security-notice">
                <strong>🛡️ Security Tips:</strong><br>
                • Never share your password with anyone<br>
                • Use a unique password for each account<br>
                • Enable two-factor authentication when available
            </div>
        </div>

        <div class="footer">
            <p>This email was sent by <strong>ADORSS</strong></p>
            <p>If you didn't request this, please <a href="mailto:support@adorss.com">contact support</a></p>
            <p>&copy; {{ date('Y') }} ADORSS. All rights reserved.</p>
        </div>
    </div>
</body>

</html>