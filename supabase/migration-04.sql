-- Liss Leagues — migration 04
-- Edward A. Liss Fantasy Football League (EALFFL): tables + seeded
-- 2022-2025 data. Safe to run on an existing database.

create table if not exists ff_standings (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  member text not null,
  reg_rank int,        -- regular-season finish (wins, then points for)
  final_rank int,      -- final placement after playoffs
  team text,
  owner text,
  record text,         -- regular season only, e.g. '10-4-0'
  wins int, losses int, ties int,
  pf numeric, pa numeric, pf_g numeric, pa_g numeric,
  div text, home text, away text, strk text,
  moves int,
  created_at timestamptz not null default now(),
  unique (season, member)
);

create table if not exists ff_playoffs (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  round text not null,
  bracket text,
  winner text not null,
  winner_seed text,
  winner_score numeric,
  loser text not null,
  loser_seed text,
  loser_score numeric,
  created_at timestamptz not null default now(),
  unique (season, round, winner, loser)
);

alter table ff_standings enable row level security;
alter table ff_playoffs enable row level security;
create policy "anon full access" on ff_standings for all using (true) with check (true);
create policy "anon full access" on ff_playoffs for all using (true) with check (true);

-- ---------------------------------------------------------------
-- Seed data (2022-2025), from the ESPN export
-- ---------------------------------------------------------------
insert into ff_standings
  (season, member, reg_rank, final_rank, team, owner, record, wins, losses, ties,
   pf, pa, pf_g, pa_g, div, home, away, strk, moves)
values
  (2022,'Rob',2,1,'Rob Liss','Rob Liss, Rob Liss','10-4-0',10,4,0,1831.24,1597.86,130.8,114.1,'4-1-0','5-2-0','5-2-0','W4',14),
  (2022,'Uncle Bill',4,2,'Uncle Bill Liss','Bill Liss','8-6-0',8,6,0,1630.92,1551.72,116.5,110.8,'3-2-0','5-2-0','3-4-0','W1',11),
  (2022,'Kyle',1,3,'Seattle Grand Larsony','Kyle Larson','11-3-0',11,3,0,1563.68,1439.44,111.7,102.8,'4-1-0','6-1-0','5-2-0','W7',38),
  (2022,'Adam',3,4,'Team liss','adam liss','9-5-0',9,5,0,1609.88,1510.36,115.0,107.9,'5-0-0','5-3-0','4-2-0','W1',5),
  (2022,'Billy',5,5,'Mei Shang Dubs','William Liss','8-6-0',8,6,0,1593.22,1649.86,113.8,117.8,'2-3-0','5-3-0','3-3-0','W2',10),
  (2022,'Ryan',8,6,'Ryan Liss','Ryan Liss','6-8-0',6,8,0,1561.96,1620.92,111.6,115.8,'2-3-0','4-2-0','2-6-0','L1',21),
  (2022,'Patrick',9,7,'Team Franchi','Patrick Franchi','6-8-0',6,8,0,1499.44,1593.46,107.1,113.8,'2-3-0','3-4-0','3-4-0','W1',20),
  (2022,'Uncle Bob',6,8,'Uncle Bob','Robert Liss','7-7-0',7,7,0,1711.8,1522.02,122.3,108.7,'3-2-0','4-4-0','3-3-0','L2',34),
  (2022,'Jack',7,9,'Lefty Liss','Jack Liss','6-8-0',6,8,0,1664.82,1626.64,118.9,116.2,'1-4-0','2-3-0','4-5-0','L1',17),
  (2022,'Uncle John',11,10,'Poland Na Zdrowie','John Liss','4-10-0',4,10,0,1510.74,1684.24,107.9,120.3,'1-4-0','3-5-0','1-5-0','L5',51),
  (2022,'Jakob',10,11,'Team Czupek','Jakob Czupek','5-9-0',5,9,0,1388.72,1610.12,99.2,115.0,'3-2-0','2-5-0','3-4-0','L2',0),
  (2022,'Ed',12,12,'Eds Dream Team','Ed Liss','4-10-0',4,10,0,1503.46,1663.24,107.4,118.8,'0-5-0','2-4-0','2-6-0','L1',17),
  (2023,'Uncle John',2,1,'Poland Na Zdrowie','John Liss','9-5-0',9,5,0,1728.74,1450.46,123.5,103.6,'3-2-0','5-3-0','4-2-0','W3',49),
  (2023,'Patrick',5,2,'Team Franchi','Patrick Franchi','7-7-0',7,7,0,1637.3,1689.54,117.0,120.7,'3-2-0','5-2-0','2-5-0','L3',17),
  (2023,'Uncle Bob',1,3,'Uncle Bob','Robert Liss','10-4-0',10,4,0,1788.54,1595.54,127.8,114.0,'4-1-0','5-3-0','5-1-0','W5',19),
  (2023,'Rob',4,4,'Rob Liss','Rob Liss, Rob Liss','8-6-0',8,6,0,1544.68,1500.34,110.3,107.2,'4-1-0','4-3-0','4-3-0','W1',11),
  (2023,'Adam',3,5,'Team liss','adam liss','9-5-0',9,5,0,1717.66,1564.56,122.7,111.8,'2-3-0','5-3-0','4-2-0','W2',5),
  (2023,'Ed',6,6,'Eds Dream Team','Ed Liss','7-7-0',7,7,0,1537.88,1496.92,109.8,106.9,'3-2-0','4-2-0','3-5-0','L1',8),
  (2023,'Ryan',10,7,'Ryan Liss','Ryan Liss','5-9-0',5,9,0,1676.36,1693.46,119.7,121.0,'0-5-0','2-4-0','3-5-0','W1',16),
  (2023,'Billy',7,8,'Dollar Bill','William Liss','7-7-0',7,7,0,1423.86,1601.64,101.7,114.4,'1-4-0','4-4-0','3-3-0','L1',15),
  (2023,'Jakob',12,9,'Team Czupek','Jakob Czupek','5-9-0',5,9,0,1193.7,1586.62,85.3,113.3,'4-1-0','2-5-0','3-4-0','L3',3),
  (2023,'Uncle Bill',9,10,'Uncle Bill Liss','Bill Liss','6-8-0',6,8,0,1488.54,1541.34,106.3,110.1,'3-2-0','2-5-0','4-3-0','L2',17),
  (2023,'Jack',11,11,'Lefty Liss','Jack Liss','5-9-0',5,9,0,1623.62,1736.2,116.0,124.0,'1-4-0','2-3-0','3-6-0','L3',16),
  (2023,'Kyle',8,12,'Grand Larsony','Kyle Larson','6-8-0',6,8,0,1699.04,1603.3,121.4,114.5,'2-3-0','4-3-0','2-5-0','W2',28),
  (2024,'Jakob',5,1,'Jakob with a K','Jakob Czupek','8-6-0',8,6,0,1561.58,1507.7,111.5,107.7,'2-3-0','3-4-0','5-2-0','W1',16),
  (2024,'Jack',2,2,'Lefty Liss','Jack Liss','9-5-0',9,5,0,1613.38,1557.54,115.2,111.3,'5-0-0','3-2-0','6-3-0','L3',15),
  (2024,'Uncle Bob',1,3,'Uncle Bob','Robert Liss','10-4-0',10,4,0,1662.48,1519.64,118.7,108.5,'4-1-0','7-1-0','3-3-0','W1',24),
  (2024,'Kyle',3,4,'Grand Larsony','Kyle Larson','8-6-0',8,6,0,1767.16,1749.94,126.2,125.0,'2-3-0','4-3-0','4-3-0','W1',19),
  (2024,'Uncle Bill',4,5,'Uncle Bill Liss','Bill Liss','8-6-0',8,6,0,1735.22,1634.28,123.9,116.7,'3-2-0','3-4-0','5-2-0','L1',36),
  (2024,'Patrick',6,6,'Team Franchi','Patrick Franchi','7-7-0',7,7,0,1707.36,1740.04,122.0,124.3,'1-4-0','4-3-0','3-4-0','W1',22),
  (2024,'Uncle John',8,7,'Poland Na Zdrowie','John Liss','7-7-0',7,7,0,1653.72,1640.48,118.1,117.2,'3-2-0','4-4-0','3-3-0','L1',39),
  (2024,'Ed',7,8,'Eds Dream Team','Ed Liss','7-7-0',7,7,0,1673.14,1521.76,119.5,108.7,'2-3-0','4-2-0','3-5-0','W3',13),
  (2024,'Ryan',10,9,'Ryan Liss','Ryan Liss','6-8-0',6,8,0,1713.34,1611.12,122.4,115.1,'3-2-0','3-3-0','3-5-0','L1',16),
  (2024,'Billy',9,10,'Two Knights Defense','William Liss','7-7-0',7,7,0,1541.02,1557.18,110.1,111.2,'2-3-0','5-3-0','2-4-0','W4',13),
  (2024,'Adam',11,11,'Team liss','adam liss','4-10-0',4,10,0,1412.82,1647.92,100.9,117.7,'2-3-0','2-6-0','2-4-0','L1',8),
  (2024,'Rob',12,12,'Rob Liss','Rob Liss, Rob Liss','3-11-0',3,11,0,1325.24,1678.86,94.7,119.9,'1-4-0','2-5-0','1-6-0','L3',8),
  (2025,'Ed',4,1,'Eds Dream Team','Ed Liss','9-5-0',9,5,0,1572.44,1330.98,112.3,95.1,'3-2-0','2-4-0','7-1-0','W2',20),
  (2025,'Jakob',1,2,'Jakob with a K','Jakob Czupek','11-3-0',11,3,0,1627.44,1507.84,116.2,107.7,'4-1-0','6-1-0','5-2-0','W1',17),
  (2025,'Rob',5,3,'Rob Liss','Rob Liss, Rob Liss','7-7-0',7,7,0,1632.12,1519.08,116.6,108.5,'2-3-0','3-4-0','4-3-0','L2',10),
  (2025,'Jack',2,4,'Lefty Liss','Jack Liss','9-5-0',9,5,0,1661.14,1527.34,118.7,109.1,'3-2-0','1-4-0','8-1-0','W1',16),
  (2025,'Uncle Bill',6,5,'Uncle Bill Liss','Bill Liss','7-7-0',7,7,0,1530.16,1524.28,109.3,108.9,'1-4-0','4-3-0','3-4-0','L2',19),
  (2025,'Patrick',3,6,'Team Franchi','Patrick Franchi','9-5-0',9,5,0,1622.12,1517.62,115.9,108.4,'4-1-0','6-1-0','3-4-0','L1',14),
  (2025,'Uncle John',8,7,'Poland Na Zdrowie','John Liss','6-8-0',6,8,0,1639.9,1689.9,117.1,120.7,'3-2-0','4-4-0','2-4-0','W3',32),
  (2025,'Billy',7,8,'T_Bill','William Liss','7-7-0',7,7,0,1494.14,1651.68,106.7,118.0,'4-1-0','3-5-0','4-2-0','W1',11),
  (2025,'Ryan',9,9,'Ryan Liss','Ryan Liss','5-9-0',5,9,0,1524.8,1582.66,108.9,113.0,'1-4-0','3-3-0','2-6-0','L1',13),
  (2025,'Adam',11,10,'Team liss','adam liss','5-9-0',5,9,0,1392.88,1616.18,99.5,115.4,'3-2-0','3-5-0','2-4-0','L1',0),
  (2025,'Uncle Bob',10,11,'Uncle Bob','Robert Liss','5-9-0',5,9,0,1504.98,1646.2,107.5,117.6,'1-4-0','5-3-0','0-6-0','W1',36),
  (2025,'Kyle',12,12,'Grand Larsony','Kyle Larson','4-10-0',4,10,0,1616.78,1705.14,115.5,121.8,'1-4-0','3-4-0','1-6-0','L1',27)
on conflict (season, member) do nothing;

insert into ff_playoffs
  (season, round, bracket, winner, winner_seed, winner_score, loser, loser_seed, loser_score)
values
  (2022,'Round 1 (Wk 15-16)','Winner''s Bracket','Uncle Bill','Uncle Bill Liss (#4)',269.48,'Kyle','Seattle Grand Larsony (#1)',265.34),
  (2022,'Round 1 (Wk 15-16)','Winner''s Bracket','Rob','Rob Liss (#2)',217.76,'Adam','Team liss (#3)',196.16),
  (2022,'Championship (Wk 17-18)','Winner''s Bracket','Rob','Rob Liss (#2)',237.64,'Uncle Bill','Uncle Bill Liss (#4)',212.16),
  (2022,'Round 2 (Wk 17-18)','Winner''s Consolation (3rd Place Game)','Kyle','Seattle Grand Larsony (#1)',196.2,'Adam','Team liss (#3)',104.0),
  (2023,'Round 1 (Wk 15)','Winner''s Bracket','Patrick','Team Franchi (#5)',79.3,'Adam','Team liss (#4)',73.14),
  (2023,'Round 1 (Wk 15)','Winner''s Bracket','Uncle John','Poland Na Zdrowie (#3)',164.12,'Ed','Eds Dream Team (#6)',84.82),
  (2023,'Round 2 (Wk 16)','Winner''s Bracket','Patrick','Team Franchi (#5)',162.74,'Uncle Bob','Uncle Bob (#1)',93.8),
  (2023,'Round 2 (Wk 16)','Winner''s Bracket','Uncle John','Poland Na Zdrowie (#3)',134.24,'Rob','Rob Liss (#2)',117.78),
  (2023,'Championship (Wk 17)','Winner''s Bracket','Uncle John','Poland Na Zdrowie (#3)',158.18,'Patrick','Team Franchi (#5)',100.9),
  (2023,'Round 3 (Wk 17)','Winner''s Consolation (3rd Place Game)','Uncle Bob','Uncle Bob (#1)',96.18,'Rob','Rob Liss (#2)',82.86),
  (2024,'Round 1 (Wk 15)','Winner''s Bracket','Jakob','Jakob with a K (#5)',137.78,'Uncle Bill','Uncle Bill Liss (#4)',108.44),
  (2024,'Round 1 (Wk 15)','Winner''s Bracket','Kyle','Grand Larsony (#3)',145.34,'Patrick','Team Franchi (#6)',120.68),
  (2024,'Round 2 (Wk 16)','Winner''s Bracket','Jakob','Jakob with a K (#5)',117.76,'Uncle Bob','Uncle Bob (#1)',115.7),
  (2024,'Round 2 (Wk 16)','Winner''s Bracket','Jack','Lefty Liss (#2)',138.68,'Kyle','Grand Larsony (#3)',110.44),
  (2024,'Championship (Wk 17)','Winner''s Bracket','Jakob','Jakob with a K (#5)',121.08,'Jack','Lefty Liss (#2)',97.14),
  (2024,'Round 3 (Wk 17)','Winner''s Consolation (3rd Place Game)','Uncle Bob','Uncle Bob (#1)',124.76,'Kyle','Grand Larsony (#3)',89.88),
  (2025,'Round 1 (Wk 15)','Winner''s Bracket','Rob','Rob Liss (#5)',160.28,'Patrick','Team Franchi (#4)',93.8),
  (2025,'Round 1 (Wk 15)','Winner''s Bracket','Jack','Lefty Liss (#3)',159.92,'Uncle Bill','Uncle Bill Liss (#6)',135.8),
  (2025,'Round 2 (Wk 16)','Winner''s Bracket','Jakob','Jakob with a K (#1)',119.5,'Rob','Rob Liss (#5)',108.9),
  (2025,'Round 2 (Wk 16)','Winner''s Bracket','Ed','Eds Dream Team (#2)',120.76,'Jack','Lefty Liss (#3)',103.7),
  (2025,'Championship (Wk 17)','Winner''s Bracket','Ed','Eds Dream Team (#2)',112.28,'Jakob','Jakob with a K (#1)',87.52),
  (2025,'Round 3 (Wk 17)','Winner''s Consolation (3rd Place Game)','Rob','Rob Liss (#5)',129.9,'Jack','Lefty Liss (#3)',123.18)
on conflict (season, round, winner, loser) do nothing;
