CREATE TABLE IF NOT EXISTS schlagwort (
    id         CHAR(36) NOT NULL PRIMARY KEY,
    comicheft_id    CHAR(36) NOT NULL REFERENCES comicheft,
    schlagwort VARCHAR(16) NOT NULL CHECK (schlagwort = 'JAVASCRIPT' OR schlagwort = 'TYPESCRIPT'),

    INDEX schlagwort_comicheft_idx(comicheft_id)
) TABLESPACE comicheftspace ROW_FORMAT=COMPACT;
