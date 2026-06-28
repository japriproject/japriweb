ALTER TABLE `members`
  ADD COLUMN `email_verified_at` DATETIME(0) NULL AFTER `email`;

CREATE TABLE `email_verification_tokens` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `member_id` INTEGER NOT NULL,
  `pending_email` VARCHAR(100) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME(0) NOT NULL,
  `used_at` DATETIME(0) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `unique_email_verification_token`(`token_hash`),
  INDEX `idx_email_verification_member`(`member_id`, `expires_at`),
  INDEX `idx_email_verification_pending`(`pending_email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
