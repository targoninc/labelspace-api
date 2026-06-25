CREATE TABLE IF NOT EXISTS tri.submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    link VARCHAR(512) NOT NULL,
    desired_release_date VARCHAR(20) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    rejected BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_by BIGINT NULL,
    rejected_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (accepted_by) REFERENCES tri.users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES tri.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tri.submission_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    vote ENUM('no', 'maybe', 'yes') NOT NULL,
    comment TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES tri.submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tri.users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_submission_user (submission_id, user_id)
);
