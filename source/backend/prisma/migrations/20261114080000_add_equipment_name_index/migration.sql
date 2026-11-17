-- Speeds up the equipment list: sorting by name (the default) and name_desc can read the index in order
-- instead of sorting every row. Searching with contains (LIKE %text%) cannot use it.
CREATE INDEX `equipments_name_idx` ON `equipments`(`name`);