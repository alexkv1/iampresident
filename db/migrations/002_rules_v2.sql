-- Migration 002 — rules v2 (GAME_RULES.md §12). Idempotent: re-runnable.
--   mysql iampresident < db/migrations/002_rules_v2.sql
-- Fresh installs get these from db/schema.sql directly; this upgrades existing DBs.

SET NAMES utf8mb4;

-- Idempotent "ADD COLUMN if missing" helper.
DROP PROCEDURE IF EXISTS _add_col;
DELIMITER $$
CREATE PROCEDURE _add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = DATABASE() AND table_name = tbl AND column_name = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

-- countries: terrain, area, coastal (gdp_md already exists)
CALL _add_col('countries', 'terrain',  "ENUM('plains','forest','mountains') NOT NULL DEFAULT 'plains'");
CALL _add_col('countries', 'area_km2', "INT NULL");
CALL _add_col('countries', 'coastal',  "TINYINT NOT NULL DEFAULT 0");

-- armies: units JSON replaces type/count; movement + strike bookkeeping
CALL _add_col('armies', 'units',            "JSON NULL");
CALL _add_col('armies', 'path',             "JSON NULL");
CALL _add_col('armies', 'kind',             "ENUM('land','sea') NULL");
CALL _add_col('armies', 'depart_tick',      "INT NULL");
CALL _add_col('armies', 'origin',           "CHAR(3) NULL");
CALL _add_col('armies', 'last_strike_tick', "INT NULL");
-- legacy type/count made nullable (units JSON is now authoritative)
SET @t := (SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='armies' AND column_name='type');
SET @s := IF(@t = 'NO', "ALTER TABLE `armies` MODIFY `type` ENUM('infantry','artillery','armor','air','navy') NULL, MODIFY `count` INT NULL", 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- territories: occupation + unrest + strike damage
CALL _add_col('territories', 'occupied_until', "INT NULL");
CALL _add_col('territories', 'unrest',         "TINYINT NOT NULL DEFAULT 0");
CALL _add_col('territories', 'damage',         "SMALLINT NOT NULL DEFAULT 0");
CALL _add_col('territories', 'prev_owner',     "INT UNSIGNED NULL");
CALL _add_col('territories', 'ruined_until',   "INT NULL");

-- diplomacy: truce + directional access
CALL _add_col('diplomacy', 'truce_until', "INT NULL");
CALL _add_col('diplomacy', 'access_ab',   "TINYINT NOT NULL DEFAULT 0");
CALL _add_col('diplomacy', 'access_ba',   "TINYINT NOT NULL DEFAULT 0");

-- player_tech: started_tick (tech_key/level/progress already exist)
CALL _add_col('player_tech', 'started_tick', "INT NULL");

DROP PROCEDURE IF EXISTS _add_col;

-- New tables
CREATE TABLE IF NOT EXISTS `diplomacy_proposals` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `from_player`  INT UNSIGNED NOT NULL,
  `to_player`    INT UNSIGNED NOT NULL,
  `type`         ENUM('alliance','truce','access') NOT NULL,
  `expires_tick` INT NOT NULL,
  `status`       ENUM('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_prop_match` (`match_id`, `status`),
  KEY `ix_prop_to` (`match_id`, `to_player`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `training` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     INT UNSIGNED NOT NULL,
  `player`       INT UNSIGNED NOT NULL,
  `country_code` CHAR(3) NOT NULL,
  `unit`         VARCHAR(16) NOT NULL,
  `count`        INT NOT NULL,
  `ready_tick`   INT NOT NULL,
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
