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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .button-container {
            text-align: center;
            margin: 30px 0;
        }

        .button {
            display: inline-block;
            padding: 12px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            border-left: 4px solid #667eea;
            padding: 12px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            color: #666;
        }

        .footer {
            border-top: 1px solid #eee;
            padding: 20px;
            text-align: center;
            background-color: #f9f9f9;
        }

        .footer-text {
            font-size: 12px;
            color: #999;
            margin: 5px 0;
        }

        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #856404;
            border-radius: 4px;
        }

        .highlight {
            color: #667eea;
            font-weight: 600;
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>

        <!-- Content -->
        <div class="content">
            <p class="greeting">Hello <span class="highlight">{{ $user->name }}</span>,</p>

            <p class="message">
                Thank you for signing up with ADORSS! To complete your registration and unlock full access to our platform, please verify your email address.
            </p>

            <!-- CTA Button -->
            <div class="button-container">
                <a href="{{ $verificationUrl }}" class="button">Verify Email Address</a>
            </div>

            <!-- Manual Link -->
            <p style="color: #666; font-size: 13px;">
                If the button doesn't work, copy and paste this link in your browser:
            </p>
            <div class="manual-link">
                {{ $verificationUrl }}
            </div>

            <!-- Warning -->
            <div class="warning">
                <strong>⏰ Time Sensitive:</strong> This verification link will expire in <strong>{{ $expiresInDays }} days</strong>. If you don't verify your email by then, your account will be temporarily locked until you complete verification.
            </div>

            <!-- Additional Info -->
            <p class="message">
                Once you verify your email, you'll have full access to:
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.8;">
                <li>Education Hub - Access courses and grades</li>
                <li>Student/Parent Portal - Track progress</li>
                <li>Driver Hub - Schedule and tracking features</li>
                <li>Messaging - Communicate with educators</li>
            </ul>

            <p class="message">
                If you didn't create an account with ADORSS, please ignore this email.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                © 2026 ADORSS Education Platform. All rights reserved.
            </p>
            <p class="footer-text">
                For support, visit <a href="https://adorss.com/support" style="color: #667eea; text-decoration: none;">adorss.com/support</a>
            </p>
            <p class="footer-text">
                This is an automated email. Please do not reply directly to this address.
            </p>
        </div>
    </div>
</body>

</html>