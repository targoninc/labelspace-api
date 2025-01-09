create schema if not exists finance;

create table if not exists finance.bandcamp_sync
(
    id               varchar(32)                             not null
        primary key,
    created_at       datetime    default current_timestamp() not null,
    synced_at        bigint                                  null,
    sync_status      varchar(32) default 'success'           null,
    time             int(20)                                 null,
    reporting_period varchar(16)                             null,
    item_url         varchar(2048)                           null,
    type             varchar(128)                            null,
    territory        varchar(8)                              null,
    name             varchar(1024)                           null,
    email            varchar(2048)                           null,
    note             varchar(2048)                           null,
    country          varchar(128)                            null,
    count            int                                     null,
    royalty          float                                   null,
    upc              varchar(32)                             null,
    constraint bandcamp_sync_id_uindex
        unique (id)
)
    engine = InnoDB;

create table if not exists finance.requests
(
    id         int auto_increment
        primary key,
    user_id    bigint                                   null,
    amount     float                                    not null,
    created_at datetime     default current_timestamp() not null,
    updated_at datetime     default current_timestamp() not null on update current_timestamp(),
    status     varchar(128) default 'requested'         not null,
    constraint requests_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete set null
)
    comment 'Stores all active requests, each gets deleted when paid' collate = utf8mb4_general_ci;

create table if not exists finance.payments
(
    id         int auto_increment
        primary key,
    date       datetime default current_timestamp() not null,
    user_id    bigint                               null,
    amount     float                                not null,
    request_id int                                  null,
    constraint payments_pk
        unique (date, amount, user_id),
    constraint payments_requests_id_fk
        foreign key (request_id) references finance.requests (id)
            on delete set null,
    constraint payments_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete set null
)
    collate = utf8mb4_general_ci;

create table if not exists finance.royalties
(
    period1        varchar(16)                              null,
    label          varchar(50)                              null,
    releasename    varchar(512)                             null,
    releasever     varchar(5)                               null,
    releaseartists varchar(512)                             null,
    upc            varchar(16)                              null,
    catalogue      varchar(9)                               null,
    title          varchar(512)                             null,
    mixver         varchar(50)                              null,
    isrc           varchar(12)                              null,
    trackartists   varchar(512)                             null,
    provider       varchar(512)                             null,
    period2        varchar(512)                             null,
    territory      varchar(3)                               null,
    delivery       varchar(9)                               null,
    type           varchar(512)                             null,
    salevoid       varchar(4)                               null,
    count          int(4)                                   null,
    royalty        double                                   null,
    dataprovider   varchar(128) default 'Symphonic'         null,
    created_at     datetime     default current_timestamp() not null,
    updated_at     datetime     default current_timestamp() not null on update current_timestamp(),
    id             int auto_increment
        primary key
)
    collate = utf8mb3_general_ci;

create index if not exists artistindex
    on finance.royalties (trackartists);

create index if not exists periodindex
    on finance.royalties (period1);

create index if not exists royalties_isrc_index
    on finance.royalties (isrc);

create index if not exists royalties_royalty_index
    on finance.royalties (royalty);

create index if not exists royalties_title_index
    on finance.royalties (title);

create table if not exists finance.splits
(
    isrc   varchar(12) not null,
    artist varchar(50) not null,
    split  float       not null,
    primary key (isrc, artist)
)
    engine = InnoDB
    collate = utf8mb4_general_ci;

create table if not exists finance.paypal_batch_payments
(
    id                  bigint auto_increment
        primary key,
    paypal_batch_id     varchar(255)                                             null,
    request_items_json  longtext collate utf8mb4_bin default '[]'                not null
        check (json_valid(`request_items_json`)),
    paypal_batch_status varchar(48)                  default 'UNKNOWN'           not null,
    created_at          datetime                     default current_timestamp() not null,
    updated_at          datetime                     default current_timestamp() not null on update current_timestamp()
);

create index if not exists paypal_batch_payments_paypal_batch_id_index
    on finance.paypal_batch_payments (paypal_batch_id);

create table if not exists finance.paypal_users
(
    paypal_user_id varchar(128) not null
        primary key,
    user_id        bigint       not null,
    given_name     varchar(512) null,
    surname        varchar(512) null,
    email_address  varchar(512) null,
    constraint paypal_users_users_id_fk
        foreign key (user_id) references tri.users (id)
            on delete cascade
);

create index if not exists paypal_users_userdata_paypal_paypal_user_id_fk
    on finance.paypal_users (paypal_user_id);

create table if not exists finance.paypal_webhooks
(
    id             varchar(128)                           not null
        primary key,
    type           varchar(64)                            not null,
    received_at    datetime   default current_timestamp() not null,
    content        longtext collate utf8mb4_bin           not null,
    paypal_user_id varchar(128)                           not null,
    handled        tinyint(1) default 0                   not null,
    updated_at     datetime   default current_timestamp() not null
);

