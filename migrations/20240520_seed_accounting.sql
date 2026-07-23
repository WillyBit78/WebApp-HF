"-- INSERTAR CAJAS PRINCIPALES
INSERT INTO public.cajas (nombre_sector, saldo_actual) VALUES 
('Cuotas', 0.00),
('Campeonatos', 0.00);

-- INSERTAR SUBCAJAS PARA CAMPEONATOS
-- Asumimos que existe una relación o que se gestionan por nombre en movimientos_contables
-- Si creamos una tabla de sub_cajas separada:
INSERT INTO public.sub_cajas (nombre, caja_id) VALUES 
('Torneo Apertura Primera', (SELECT id FROM public.cajas WHERE nombre_sector = 'Campeonatos')),
('Copa Haedo Sub-17', (SELECT id FROM public.cajas WHERE nombre_sector = 'Campeonatos')),
('Liga Local Reserva', (SELECT id FROM public.cajas WHERE nombre_sector = 'Campeonatos'));
"