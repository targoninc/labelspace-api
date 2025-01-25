create schema if not exists tri;

create table if not exists tri.compilations
(
    id   int auto_increment
        primary key,
    name varchar(512) not null
)
    engine = InnoDB
    collate = utf8mb4_general_ci;

create table if not exists tri.logs
(
    order_id       bigint auto_increment
        primary key,
    correlation_id varchar(64)                          null,
    time           datetime default current_timestamp() not null,
    host           varchar(128)                         null,
    stack          longtext                             null,
    logLevel       int                                  not null,
    message        varchar(2048)                        not null,
    properties     longtext collate utf8mb4_bin         null
        check (json_valid(`properties`))
);

create index if not exists logs_time_index
    on tri.logs (time);

create table if not exists tri.permissions
(
    id          int auto_increment
        primary key,
    name        varchar(64)                          not null,
    description varchar(256)                         not null,
    created_at  datetime default current_timestamp() not null,
    updated_at  datetime default current_timestamp() not null on update current_timestamp()
);

create table if not exists tri.possible_usersettings
(
    name        varchar(128)                 not null
        primary key,
    description varchar(512)                 not null,
    type        varchar(32) default 'string' not null
);

create table if not exists tri.artists
(
    id       bigint auto_increment
        primary key,
    user_id  bigint               null,
    name     mediumtext           not null,
    has_logo tinyint(1) default 0 not null,
    constraint artists_pk
        unique (name) using hash
);

create index if not exists artists_name_index
    on tri.artists (name(768));

create index if not exists artists_users_id_fk
    on tri.artists (user_id);

create table if not exists tri.users
(
    id                  bigint auto_increment
        primary key,
    username            varchar(32)                            not null,
    legal_name          varchar(128)                           null,
    country             varchar(128)                           null,
    state               varchar(128)                           null,
    mfa_enabled         tinyint(1) default 0                   not null,
    password_hash       varchar(256)                           not null,
    description         varchar(4096)                          null,
    created_at          timestamp  default current_timestamp() not null,
    updated_at          timestamp  default current_timestamp() not null on update current_timestamp(),
    deleted_at          timestamp                              null,
    lastlogin           timestamp                              null,
    secondlastlogin     timestamp                              null,
    password_updated_at timestamp  default current_timestamp() null,
    tos_agreed_at       timestamp  default current_timestamp() null,
    ip                  varchar(128)                           null,
    password_token      varchar(64)                            null,
    constraint users_id_uindex
        unique (id),
    constraint users_pk
        unique (username)
);

create table if not exists tri.user_emails
(
    user_id           bigint               not null,
    email             varchar(512)         not null,
    `primary`         tinyint(1) default 0 not null,
    verification_code varchar(64)          not null,
    verified          tinyint(1) default 0 not null,
    verified_at       datetime             null,
    primary key (user_id, email),
    constraint user_emails_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade
);

create index if not exists user_emails_verification_code_index
    on tri.user_emails (verification_code);

create table if not exists tri.action_log
(
    id               bigint auto_increment
        primary key,
    user_id          bigint                               not null,
    action_name      varchar(128)                         not null,
    actioned_user_id bigint                               not null,
    additional_info  longtext collate utf8mb4_bin         null
        check (json_valid(`additional_info`)),
    created_at       datetime default current_timestamp() not null,
    constraint action_log_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade,
    constraint action_log_users_id_fk_2
        foreign key (actioned_user_id) references tri.users (id)
            on delete cascade
);

create table if not exists tri.albums
(
    id             bigint auto_increment
        primary key,
    artists        mediumtext                               not null,
    compilation_id int                                      null,
    title          varchar(512) default ''                  not null,
    upc            varchar(16)                              null,
    release_date   datetime     default current_timestamp() not null,
    created_at     datetime     default current_timestamp() not null,
    updated_at     datetime     default current_timestamp() not null on update current_timestamp(),
    price          double       default 5                   null,
    has_cover      tinyint(1)   default 0                   not null,
    constraint albums_pk
        unique (upc),
    constraint albums_compilations_id_fk
        foreign key (compilation_id) references tri.compilations (id)
            on delete set null
);

create table if not exists tri.tracks
(
    id              bigint auto_increment
        primary key,
    album_id        bigint                                 null,
    title           varchar(255)                           not null,
    artists         mediumtext                             not null,
    isrc            varchar(16)                            null,
    credits         varchar(512)                           null,
    loudness_data   varchar(2000)                          null,
    genre           varchar(512)                           null,
    length          double     default 0                   not null,
    release_date    datetime                               null,
    updated_at      datetime   default current_timestamp() not null on update current_timestamp(),
    created_at      datetime   default current_timestamp() not null,
    has_cover       tinyint(1) default 0                   not null,
    price           double     default 1                   null,
    processed       tinyint(1) default 0                   not null,
    link_spotify    mediumtext                             null,
    link_youtube    mediumtext                             null,
    link_soundcloud mediumtext                             null,
    link_applemusic mediumtext                             null,
    link_bandcamp   mediumtext                             null,
    link_lyda       mediumtext                             null,
    constraint tracks_pk
        unique (isrc),
    constraint tracks_albums_id_fk
        foreign key (album_id) references tri.albums (id)
            on delete set null
);

create index if not exists tracks_artists_index
    on tri.tracks (artists(768));

create index if not exists tracks_created_at_index
    on tri.tracks (created_at);

create index if not exists tracks_genre_index
    on tri.tracks (genre);

create index if not exists tracks_title_index
    on tri.tracks (title);

create table if not exists tri.user_settings
(
    user_id    bigint                               not null,
    `key`      varchar(128)                         not null,
    value      varchar(128)                         null,
    created_at datetime default current_timestamp() not null,
    updated_at datetime default current_timestamp() not null on update current_timestamp(),
    primary key (user_id, `key`),
    constraint user_settings_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade
);

create table if not exists tri.users_permissions
(
    user_id       bigint                               not null,
    permission_id int                                  not null,
    created_at    datetime default current_timestamp() not null,
    primary key (user_id, permission_id),
    constraint users_permissions_permissions_id_fk
        foreign key (permission_id) references tri.permissions (id)
            on delete cascade,
    constraint users_permissions_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade
);

