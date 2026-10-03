-- Tabla de auditoría: registra cualquier cambio en las tablas marcadas como auditables
CREATE TABLE auditoria_log (
    id BIGSERIAL PRIMARY KEY,
    tabla_afectada TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    accion TEXT NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE'
    usuario_id TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
    datos_anteriores JSONB,
    datos_nuevos JSONB
);

-- Función genérica que cualquier trigger de auditoría va a reutilizar
CREATE OR REPLACE FUNCTION fn_registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_log (tabla_afectada, registro_id, accion, usuario_id, datos_anteriores, datos_nuevos)
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        TG_OP,
        current_setting('app.current_user_id', true),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('UPDATE', 'INSERT') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso: auditar la tabla usuarios (los módulos siguientes agregarán más triggers así)
CREATE TRIGGER trg_auditoria_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_registrar_auditoria();