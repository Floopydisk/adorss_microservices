<?php

namespace App\Jobs;

use App\Mail\EmailVerificationMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendEmailVerification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 300, 900]; // Retry after 1min, 5min, 15min
    public $timeout = 30;

    public function __construct(
        public User $user,
        public string $verificationToken,
        public int $expiresInDays = 7
    ) {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        try {
            Mail::send(new EmailVerificationMail(
                $this->user,
                $this->verificationToken,
                $this->expiresInDays
            ));

            Log::info('Email verification sent', [
                'user_id' => $this->user->id,
                'email' => $this->user->email,
                'attempt' => $this->attempts(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send email verification', [
                'user_id' => $this->user->id,
                'email' => $this->user->email,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            // Rethrow to trigger retry
            if ($this->attempts() < $this->tries) {
                throw $e;
            }

            // Log final failure
            Log::critical('Email verification failed after all retries', [
                'user_id' => $this->user->id,
                'email' => $this->user->email,
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::critical('Email verification job permanently failed', [
            'user_id' => $this->user->id,
            'email' => $this->user->email,
            'error' => $exception->getMessage(),
        ]);
    }
}
