-- I Am President — database schema
-- MySQL 8 / InnoDB, utf8mb4. Mirrors yuz conventions (mysqli + DB wrapper).
--
-- Load order:
--   mysql iampresident < db/schema.sql
--   mysql iampresident < db/seeds/countries.sql   (generated — see worker/gen_countries.js)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Accounts & sessions (yuz-compatible: cookie AUTH -> sessions -> users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255)      DEFAULT NULL,
  `display_name`  VARCHAR(64)  NOT NULL,
  `password_hash` VARCHAR(255)      DEFAULT NULL,
  `is_guest`      TINYINT(1)   NOT NULL DEFAULT 1,
  `status`        TINYINT(1)   NOT NULL DEFAULT 1,
  `date_created`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user`         INT UNSIGNED NOT NULL,
  `token`        VARCHAR(128) NOT NULL,
  `status`       TINYINT(1)   NOT NULL DEFAULT 1,
  `date_created` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sessions_token` (`token`),
  KEY `ix_sessions_user` (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Static world data (seeded from Natural Earth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `countries` (
  `code`       CHAR(3)      NOT NULL,          -- ISO_A3 (home-grown fallback for -99)
  `code2`      CHAR(2)           DEFAULT NULL, -- ISO_A2
  `name`       VARCHAR(96)  NOT NULL,
  `continent`  VARCHAR(32)       DEFAULT NULL,
  `region`     VARCHAR(48)       DEFAULT NULL,
  `subregion`  VARCHAR(48)       DEFAULT NULL,
  `pop_est`    BIGINT UNSIGNED   DEFAULT 0,
  `gdp_md`     BIGINT            DEFAULT 0,
  -- gameplay base attributes (0-100 richness scales, land_slots = buildable capacity)
  `land_slots` SMALLINT     NOT NULL DEFAULT 8,
  `farmland`   TINYINT      NOT NULL DEFAULT 20,  -- food potential
  `minerals`   TINYINT      NOT NULL DEFAULT 20,  -- ore richness
  `oil`        TINYINT      NOT NULL DEFAULT 10,  -- oil richness
  `start_pop`  BIGINT UNSIGNED NOT NULL DEFAULT 1000000,
  `lon`        DECIMAL(9,5)      DEFAULT NULL,    -- centroid (hudGeo overrides for RUS/USA/CAN/NOR/FRA/CHL/IDN)
  `lat`        DECIMAL(9,5)      DEFAULT NULL,
  `area_km2`   INT               DEFAULT NULL,    -- geodesic area (GAME_RULES §5 victory weight)
  `coastal`    TINYINT      NOT NULL DEFAULT 0,   -- can be a sea-route endpoint (GAME_RULES §2)
  `terrain`    ENUM('plains','forest','mountains') NOT NULL DEFAULT 'plains', -- combat mult (§3)
  PRIMARY KEY (`code`),
  KEY `ix_countries_continent` (`continent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `country_neighbors` (
  `country`  CHAR(3) NOT NULL,
  `neighbor` CHAR(3) NOT NULL,
  PRIMARY KEY (`country`, `neighbor`),
  KEY `ix_neighbor` (`neighbor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Current real-world leader per country. Editable: when a leader changes,
-- UPDATE the row (or use /api/admin/setLeader) and the game reflects it.
CREATE TABLE IF NOT EXISTS `country_leaders` (
  `code`         CHAR(3)     NOT NULL,
  `name`         VARCHAR(96) NOT NULL,            -- e.g. "Kim Jong Un"
  `title`        VARCHAR(48) NOT NULL DEFAULT 'President',
  `date_updated` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Matches (game instances) & players
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `matches` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`             VARCHAR(96)  NOT NULL,
  `join_code`        CHAR(6)           DEFAULT NULL,   -- private rooms
  `mode`             ENUM('online','private','single') NOT NULL DEFAULT 'online',
  `status`           ENUM('lobby','active','ended')    NOT NULL DEFAULT 'lobby',
  `max_players`      TINYINT      NOT NULL DEFAULT 8,
  `current_tick`     INT          NOT NULL DEFAULT 0,
  `tick_interval_sec` SMALLINT    NOT NULL DEFAULT 20, -- real seconds per game tick
  `map_seed`         INT          NOT NULL DEFAULT 0,
  `host_user`        INT UNSIGNED      DEFAULT NULL,
  `winner_player`    INT UNSIGNED      DEFAULT NULL,
  `settings`         JSON              DEFAULT NULL,
  `next_tick_at`     DATETIME          DEFAULT NULL,   -- when the worker should next advance
  `date_created`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_started`     DATETIME          DEFAULT NULL,
  `date_ended`       DATETIME          DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_matches_join_code` (`join_code`),
  KEY `ix_matches_status_mode` (`status`, `mode`),
  KEY `ix_matches_next_tick` (`status`, `next_tick_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `match_players` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `user`         INT UNSIGNED      DEFAULT NULL,   -- NULL => AI player
  `is_ai`        TINYINT(1)   NOT NULL DEFAULT 0,
  `ai_level`     TINYINT      NOT NULL DEFAULT 1,  -- 1 easy .. 3 hard
  `display_name` VARCHAR(96)  NOT NULL,            -- in-match persona (leader name once a country is chosen)
  `leader_title` VARCHAR(48)       DEFAULT NULL,   -- e.g. "Supreme Leader", "Chancellor"
  `country_code` CHAR(3)           DEFAULT NULL,   -- chosen home country
  `color`        CHAR(7)      NOT NULL DEFAULT '#cccccc',
  `slot`         TINYINT      NOT NULL DEFAULT 0,
  `is_host`      TINYINT(1)   NOT NULL DEFAULT 0,
  `is_ready`     TINYINT(1)   NOT NULL DEFAULT 0,
  `status`       ENUM('active','defeated','left') NOT NULL DEFAULT 'active',
  `team`         INT UNSIGNED      DEFAULT NULL,
  -- economy stockpiles (resolved every tick by the engine)
  `pop`          BIGINT       NOT NULL DEFAULT 0,
  `food`         DECIMAL(16,2) NOT NULL DEFAULT 0,
  `energy`       DECIMAL(16,2) NOT NULL DEFAULT 0,
  `minerals`     DECIMAL(16,2) NOT NULL DEFAULT 0,
  `gold`         DECIMAL(16,2) NOT NULL DEFAULT 0,
  `oil`          DECIMAL(16,2) NOT NULL DEFAULT 0,
  `research`     DECIMAL(16,2) NOT NULL DEFAULT 0,
  `date_joined`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_player_slot` (`match_id`, `slot`),
  KEY `ix_players_match` (`match_id`),
  KEY `ix_players_user` (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `teams` (
  `id`       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id` INT UNSIGNED NOT NULL,
  `name`     VARCHAR(48)  NOT NULL,
  `color`    CHAR(7)      NOT NULL DEFAULT '#888888',
  PRIMARY KEY (`id`),
  KEY `ix_teams_match` (`match_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Live match state (the board)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `territories` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `country_code` CHAR(3)      NOT NULL,
  `owner`          INT UNSIGNED    DEFAULT NULL,  -- match_players.id, NULL = neutral
  `is_capital`     TINYINT(1)  NOT NULL DEFAULT 0,
  `occupied_until` INT             DEFAULT NULL,  -- tick when occupation ends (GAME_RULES §6)
  `unrest`         TINYINT     NOT NULL DEFAULT 0,
  `damage`         SMALLINT    NOT NULL DEFAULT 0, -- temporary garrison reduction (strikes)
  `prev_owner`     INT UNSIGNED    DEFAULT NULL,  -- for revolt
  `ruined_until`   INT             DEFAULT NULL,  -- nuke: farmland output 0 until this tick
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_territory` (`match_id`, `country_code`),
  KEY `ix_territory_owner` (`match_id`, `owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `buildings` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`        INT UNSIGNED NOT NULL,
  `player`          INT UNSIGNED NOT NULL,
  `country_code`    CHAR(3)      NOT NULL,
  `type`            ENUM('farm','mine','oil_rig','power_plant','factory','lab','housing','bank') NOT NULL,
  `level`           SMALLINT     NOT NULL DEFAULT 1,
  `status`          ENUM('building','active') NOT NULL DEFAULT 'building',
  `complete_at_tick` INT         NOT NULL DEFAULT 0,
  `date_created`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_buildings_match` (`match_id`),
  KEY `ix_buildings_player` (`player`),
  KEY `ix_buildings_country` (`match_id`, `country_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `armies` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`      INT UNSIGNED NOT NULL,
  `player`        INT UNSIGNED NOT NULL,
  `country_code`  CHAR(3)      NOT NULL,           -- current (or destination) location
  `units`         JSON              DEFAULT NULL,  -- {"infantry":24,"armor":6,...} (GAME_RULES §1)
  `type`          ENUM('infantry','artillery','armor','air','navy') DEFAULT NULL, -- legacy; units JSON is authoritative
  `count`         INT               DEFAULT NULL,
  `moving_to`     CHAR(3)           DEFAULT NULL,
  `path`          JSON              DEFAULT NULL,  -- list of country codes for the march
  `kind`          ENUM('land','sea') DEFAULT NULL,
  `origin`        CHAR(3)           DEFAULT NULL,  -- where survivors return
  `depart_tick`   INT               DEFAULT NULL,
  `arrive_at_tick` INT              DEFAULT NULL,
  `last_strike_tick` INT            DEFAULT NULL,
  `date_created`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_armies_match` (`match_id`),
  KEY `ix_armies_loc` (`match_id`, `country_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `player_tech` (
  `id`       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id` INT UNSIGNED NOT NULL,
  `player`   INT UNSIGNED NOT NULL,
  `tech_key` VARCHAR(48)  NOT NULL,
  `level`    SMALLINT     NOT NULL DEFAULT 0,       -- 0 researching, 1 done
  `progress` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `started_tick` INT           DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_player_tech` (`match_id`, `player`, `tech_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Interaction: diplomacy, trade, chat, event log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `diplomacy` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `player_a`     INT UNSIGNED NOT NULL,            -- always the lower player id
  `player_b`     INT UNSIGNED NOT NULL,
  `state`        ENUM('neutral','allied','war','truce') NOT NULL DEFAULT 'neutral',
  `truce_until`  INT               DEFAULT NULL,    -- tick a truce ends (GAME_RULES §7)
  `access_ab`    TINYINT      NOT NULL DEFAULT 0,   -- a granted b military access (directional)
  `access_ba`    TINYINT      NOT NULL DEFAULT 0,
  `date_updated` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_diplo_pair` (`match_id`, `player_a`, `player_b`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `trades` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `from_player`  INT UNSIGNED NOT NULL,
  `to_player`    INT UNSIGNED NOT NULL,
  `give`         JSON         NOT NULL,            -- {"gold":500,"minerals":200}
  `receive`      JSON         NOT NULL,            -- {"food":300}
  `status`       ENUM('pending','accepted','declined','cancelled','expired') NOT NULL DEFAULT 'pending',
  `date_created` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_trades_match` (`match_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `player`       INT UNSIGNED      DEFAULT NULL,   -- NULL = system message
  `scope`        ENUM('all','team') NOT NULL DEFAULT 'all',
  `body`         VARCHAR(500) NOT NULL,
  `date_created` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_chat_match` (`match_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `match_events` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `tick`         INT          NOT NULL DEFAULT 0,
  `type`         VARCHAR(48)  NOT NULL,            -- 'build_complete','conquest','trade','war',...
  `data`         JSON              DEFAULT NULL,
  `date_created` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_events_match` (`match_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Phase-2: proposals, training queue, strategic arsenal (GAME_RULES §7, §1a, §9)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `diplomacy_proposals` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `from_player`  INT UNSIGNED NOT NULL,
  `to_player`    INT UNSIGNED NOT NULL,
  `type`         ENUM('alliance','truce','access') NOT NULL,
  `expires_tick` INT          NOT NULL,
  `status`       ENUM('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
  `date_created` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_prop_match` (`match_id`, `status`),
  KEY `ix_prop_to` (`match_id`, `to_player`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `training` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `player`       INT UNSIGNED NOT NULL,
  `country_code` CHAR(3)      NOT NULL,
  `unit`         VARCHAR(16)  NOT NULL,
  `count`        INT          NOT NULL,
  `ready_tick`   INT          NOT NULL,
  `date_created` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_training_match` (`match_id`, `player`),
  KEY `ix_training_ready` (`match_id`, `ready_tick`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `arsenal` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`      INT UNSIGNED NOT NULL,
  `player`        INT UNSIGNED NOT NULL,
  `item`          ENUM('srbm','mrbm','icbm','warhead') NOT NULL,
  `stock`         INT NOT NULL DEFAULT 0,
  `in_production` INT NOT NULL DEFAULT 0,
  `ready_tick`    INT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_arsenal` (`match_id`, `player`, `item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
