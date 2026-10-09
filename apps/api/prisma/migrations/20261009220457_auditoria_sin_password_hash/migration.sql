-- La función del trigger ahora omite password_hash de lo que guarda en la auditoría
CREATE OR REPLACE FUNCTION fn_registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_log (tabla_afectada, registro_id, accion, usuario_id, datos_anteriores, datos_nuevos)
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        TG_OP,
        current_setting('app.current_user_id', true),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) - 'password_hash' ELSE NULL END,
        CASE WHEN TG_OP IN ('UPDATE', 'INSERT') THEN to_jsonb(NEW) - 'password_hash' ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Limpiar los hashes que ya quedaron guardados en registros anteriores
UPDATE auditoria_log
SET datos_anteriores = datos_anteriores - 'password_hash',
    datos_nuevos = datos_nuevos - 'password_hash'
WHERE tabla_afectada = 'usuarios';