<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $resetToken,
        public int $expiresInMinutes = 60
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your ADORSS Password',
        );
    }

    public function content(): Content
    {
        $resetUrl = $this->generateResetUrl();

        return new Content(
            view: 'emails.password-reset',
            with: [
                'user' => $this->user,
                'resetUrl' => $resetUrl,
                'expiresInMinutes' => $this->expiresInMinutes,
                'token' => $this->resetToken,
            ],
        );
    }

    private function generateResetUrl(): string
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return "{$frontendUrl}/reset-password?token={$this->resetToken}&email={$this->user->email}";
    }

    public function attachments(): array
    {
        return [];
    }
}
