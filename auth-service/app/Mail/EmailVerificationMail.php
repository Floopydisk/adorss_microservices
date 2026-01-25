<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $verificationToken,
        public int $expiresInDays = 7
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verify Your ADORSS Email Address',
        );
    }

    public function content(): Content
    {
        $verificationUrl = $this->generateVerificationUrl();

        return new Content(
            view: 'emails.verify-email',
            with: [
                'user' => $this->user,
                'verificationUrl' => $verificationUrl,
                'expiresInDays' => $this->expiresInDays,
                'token' => $this->verificationToken,
            ],
        );
    }

    private function generateVerificationUrl(): string
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return "{$frontendUrl}/verify-email?token={$this->verificationToken}";
    }

    public function attachments(): array
    {
        return [];
    }
}
