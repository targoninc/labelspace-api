create schema if not exists tri;

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
    id         bigint auto_increment
        primary key,
    user_id    bigint     null,
    name       mediumtext not null,
    legal_name text       not null,
    country    text       null,
    state      text       null,
    constraint artists_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete set null
);

create index if not exists artists_name_index
    on tri.artists (name(768));

create table if not exists tri.users
(
    id                  bigint auto_increment
        primary key,
    username            varchar(32)                            not null,
    mfa_enabled         tinyint(1) default 0                   not null,
    password_hash       varchar(256)                           not null,
    displayname         varchar(64)                            not null,
    description         varchar(4096)                          null,
    created_at          timestamp  default current_timestamp() not null,
    updated_at          timestamp  default current_timestamp() not null,
    deleted_at          timestamp                              null,
    lastlogin           timestamp                              null,
    secondlastlogin     timestamp                              null,
    password_updated_at timestamp  default current_timestamp() null,
    tos_agreed_at       timestamp  default current_timestamp() null,
    ip                  varchar(128)                           null,
    password_token      varchar(64)                            null,
    has_avatar          tinyint(1) default 0                   not null,
    has_banner          tinyint(1) default 0                   not null,
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
    constraint user_emails_pk
        unique (verification_code),
    constraint user_emails_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade
);

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
    id           bigint auto_increment
        primary key,
    user_id      bigint                                   not null,
    title        varchar(512) default ''                  not null,
    description  varchar(2048)                            null,
    upc          varchar(12)                              null,
    release_date datetime     default current_timestamp() not null,
    created_at   datetime     default current_timestamp() not null,
    updated_at   datetime     default current_timestamp() not null on update current_timestamp(),
    visibility   varchar(32)  default 'private'           not null,
    secretcode   varchar(32)                              null,
    price        double       default 5                   null,
    has_cover    tinyint(1)   default 0                   not null,
    constraint albums_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade
);

create table if not exists tri.tracks
(
    id            bigint auto_increment
        primary key,
    user_id       bigint                                 not null,
    title         varchar(255)                           not null,
    artistname    varchar(128)                           null,
    isrc          varchar(12)                            null,
    upc           varchar(16)                            null,
    credits       varchar(512)                           null,
    loudness_data varchar(2000)                          null,
    genre         varchar(512)                           null,
    version       varchar(512)                           null,
    versionid     int                                    null,
    length        double     default 0                   not null,
    description   varchar(2048)                          null,
    release_date  datetime                               null,
    updated_at    datetime   default current_timestamp() not null on update current_timestamp(),
    created_at    datetime   default current_timestamp() not null,
    plays         bigint     default 0                   null,
    secretcode    varchar(32)                            null,
    has_cover     tinyint(1) default 0                   not null,
    monetization  tinyint(1) default 0                   not null,
    extension     varchar(16)                            null,
    filename      varchar(512)                           null,
    price         double     default 1                   null,
    processed     tinyint(1) default 0                   not null,
    constraint tracks_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade
);

create index if not exists tracks_created_at_index
    on tri.tracks (created_at);

create index if not exists tracks_description_index
    on tri.tracks (description(768));

create index if not exists tracks_genre_index
    on tri.tracks (genre);

create index if not exists tracks_plays_index
    on tri.tracks (plays);

create index if not exists tracks_title_index
    on tri.tracks (title);

create table if not exists tri.albumtracks
(
    album_id   bigint                               not null,
    track_id   bigint                               not null,
    user_id    bigint                               not null,
    position   bigint   default -1                  not null,
    created_at datetime default current_timestamp() not null,
    primary key (album_id, track_id),
    constraint albumtracks_albums_id_fk
        foreign key (album_id) references tri.albums (id)
            on delete cascade,
    constraint albumtracks_tracks_id_fk
        foreign key (track_id) references tri.tracks (id)
            on delete cascade,
    constraint albumtracks_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade
);

create index if not exists tracks_created_at_index
    on tri.tracks (created_at);

create index if not exists tracks_description_index
    on tri.tracks (description(768));

create index if not exists tracks_genre_index
    on tri.tracks (genre);

create index if not exists tracks_plays_index
    on tri.tracks (plays);

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

