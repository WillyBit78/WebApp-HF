MP_ACCESS_TOKEN=APP_USR-3322444120483456-062819-f186f817a6a28fd7251c13baaf3d014e-43153257
MP_CLIENT_ID=3322444120483456
MP_CLIENT_SECRET=8MCtCCjiMXHbdPIp0x8TbaMzF9mjEvYF
MP_ALIAS=willy.78.mp
MP_CVU=0000003100098098995218
MP_ACCOUNT_NAME="Guillermo Pablo Pazos"
```

### Próximo paso: La Lógica de Validación Automática

Con la base de datos lista y las credenciales configuradas, voy a empezar a desarrollar el **módulo de conciliación**. 

Necesito crear un servicio que haga lo siguiente:
1. Reciba la imagen del comprobante.
2. Use OCR para extraer los datos clave (`Monto`, `N° Operación/COELSA`).
3. Consulte `/v1/payments/search` en Mercado Pago filtrando por esos datos.
4. Si hay coincidencia $\rightarrow$ actualiza `pagos_comprobantes` $\rightarrow$ inserta registro en `movimientos_contables` $\rightarrow$ suma al saldo de la `caja` correspondiente y marca al socio como `al_dia`.

**Voy a empezar buscando si ya existe alguna carpeta de "servicios" o "utils" en el proyecto para ubicar esta lógica.**

```tool
TOOL_NAME: ls
BEGIN_ARG: dirPath
"src"