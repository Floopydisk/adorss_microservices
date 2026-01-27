<?php

namespace App\Jobs;

use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendPasswordReset implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 300, 900]; // Retry after 1min, 5min, 15min
    public $timeout = 30;

    public function __construct(
        public User $user,
        public string $resetToken,
        public int $expiresInMinutes = 60
    ) {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        try {
            Mail::to($this->user->email)->send(new PasswordResetMail(
                $this->user,
                $this->resetToken,
                $this->expiresInMinutes
            ));

            Log::info('Password reset email sent', [
                'user_id' => $this->user->id,
                'email' => $this->user->email,
                'attempt' => $this->attempts(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', [
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
            Log::critical('Password reset email failed after all retries', [
                'user_id' => $this->user->id,
                'email' => $this->user->email,
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::critical('Password reset job failed permanently', [
            'user_id' => $this->user->id,
            'email' => $this->user->email,
            'error' => $exception->getMessage(),
        ]);
    }
}
