export const getRaceError = (error?: string) => {
  if (error === 'room_not_found') return 'Sala no encontrada';
  if (error === 'not_found') return 'Sala no encontrada';
  if (error === 'already_started') return 'La carrera ya empezo';
  if (error === 'room_full') return 'Sala llena (max 8)';
  if (error === 'need_more_players') return 'Necesitas al menos 2 jugadores';
  if (error === 'not_host') return 'Solo el host puede iniciar la carrera';
  if (error === 'missing') return 'Faltan datos para continuar';
  if (error === 'race_storage_unavailable') return 'El juego online necesita MongoDB configurado (MONGODB_URI)';
  if (error === 'race_server_error') return 'El servidor del juego tuvo un problema';
  if (error === 'invalid_response') return 'El servidor respondio algo inesperado';
  if (error === 'network_unavailable') return 'No se pudo conectar con el servidor';
  return error ?? 'Error';
};
