-- Country leaders seed.
--
-- ⚠️  EDITABLE DATA — verify and keep current. When a leader changes (election,
--     succession, coup…), update the relevant row, e.g.:
--        UPDATE country_leaders SET name='New Name', title='President' WHERE code='USA';
--     or call POST /api/admin/setLeader (bearer internal-key) to also update any
--     live/lobby matches. Codes are ISO_A3 and must match the `countries` table.
--
-- Not every country needs a row; countries without one fall back to
-- "<Title> of <Country>" in game.

SET NAMES utf8mb4;

INSERT INTO `country_leaders` (`code`,`name`,`title`) VALUES
('USA','Donald Trump','President'),
('RUS','Vladimir Putin','President'),
('CHN','Xi Jinping','President'),
('PRK','Kim Jong Un','Supreme Leader'),
('KOR','Lee Jae-myung','President'),
('GBR','Keir Starmer','Prime Minister'),
('DEU','Friedrich Merz','Chancellor'),
('FRA','Emmanuel Macron','President'),
('IND','Narendra Modi','Prime Minister'),
('JPN','Sanae Takaichi','Prime Minister'),
('CAN','Mark Carney','Prime Minister'),
('BRA','Luiz Inácio Lula da Silva','President'),
('SAU','Salman bin Abdulaziz','King'),
('MEX','Claudia Sheinbaum','President'),
('AUS','Anthony Albanese','Prime Minister'),
('ITA','Giorgia Meloni','Prime Minister'),
('ESP','Pedro Sánchez','Prime Minister'),
('IDN','Prabowo Subianto','President'),
('TUR','Recep Tayyip Erdoğan','President'),
('EGY','Abdel Fattah el-Sisi','President'),
('NGA','Bola Tinubu','President'),
('ZAF','Cyril Ramaphosa','President'),
('ARG','Javier Milei','President'),
('UKR','Volodymyr Zelensky','President'),
('POL','Karol Nawrocki','President'),
('NLD','Dick Schoof','Prime Minister'),
('SWE','Ulf Kristersson','Prime Minister'),
('NOR','Jonas Gahr Støre','Prime Minister'),
('FIN','Petteri Orpo','Prime Minister'),
('DNK','Mette Frederiksen','Prime Minister'),
('IRN','Ali Khamenei','Supreme Leader'),
('IRQ','Mohammed Shia al-Sudani','Prime Minister'),
('ISR','Benjamin Netanyahu','Prime Minister'),
('PAK','Shehbaz Sharif','Prime Minister'),
('VNM','Tô Lâm','General Secretary'),
('THA','Anutin Charnvirakul','Prime Minister'),
('PHL','Ferdinand Marcos Jr.','President'),
('MYS','Anwar Ibrahim','Prime Minister'),
('NZL','Christopher Luxon','Prime Minister'),
('GRC','Kyriakos Mitsotakis','Prime Minister'),
('HUN','Viktor Orbán','Prime Minister'),
('COL','Gustavo Petro','President'),
('CHL','Gabriel Boric','President'),
('VEN','Nicolás Maduro','President'),
('ETH','Abiy Ahmed','Prime Minister'),
('KEN','William Ruto','President'),
('MAR','Mohammed VI','King'),
('DZA','Abdelmadjid Tebboune','President'),
('KAZ','Kassym-Jomart Tokayev','President'),
('UZB','Shavkat Mirziyoyev','President'),
('SYR','Ahmed al-Sharaa','President'),
('QAT','Tamim bin Hamad Al Thani','Emir'),
('ARE','Mohamed bin Zayed Al Nahyan','President'),
('JOR','Abdullah II','King'),
('CUB','Miguel Díaz-Canel','President')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `title` = VALUES(`title`), `date_updated` = NOW();
