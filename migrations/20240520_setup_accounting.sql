# Configuración de Mercado Pago para Haedo Futsal
# (Las credenciales reales deben guardarse en .env y NO subirse a GitHub)

MP_ACCESS_TOKEN=TU_ACCESS_TOKEN_AQUI
MP_CLIENT_ID=TU_CLIENT_ID_AQUI
MP_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
MP_ALIAS=willy.78.mp
MP_CVU=0000003100098098995218
MP_ACCOUNT_NAME="Guillermo Pablo Pazos"

### Lógica de Validación Automática de Transferencias Recibidas (Money In)

El servicio consulta en vivo las transferencias entrantes (CVU / Alias) mediante la API Oficial de Mercado Pago:
1. Recibe la imagen o datos del comprobante compartido por el socio.
2. Extrae los datos clave (`Monto`, `N° Operación/COELSA`, `Emisor`).
3. Compara en tiempo real contra las transferencias recibidas en la cuenta personal (`operation_type: money_transfer` / `bank_transfer`).
4. Al encontrar coincidencia -> concilia la cuota del socio, suma a la Caja de Cuotas y registra en el Log de Auditoría.