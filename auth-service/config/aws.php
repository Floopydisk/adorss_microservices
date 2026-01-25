<?php

return [
    /**
     * AWS Service Configuration
     */
    'access_key_id' => env('AWS_ACCESS_KEY_ID'),
    'secret_access_key' => env('AWS_SECRET_ACCESS_KEY'),
    'default' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),

    /**
     * SNS Configuration (for SMS)
     */
    'sns' => [
        'enabled' => env('AWS_ACCESS_KEY_ID') ? true : false,
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /**
     * SES Configuration (for Email)
     */
    'ses' => [
        'enabled' => env('AWS_ACCESS_KEY_ID') ? true : false,
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /**
     * S3 Configuration (for file storage)
     */
    's3' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        'bucket' => env('AWS_BUCKET'),
        'url' => env('AWS_URL'),
        'endpoint' => env('AWS_ENDPOINT'),
        'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
    ],
];
