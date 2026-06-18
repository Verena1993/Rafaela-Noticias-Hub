import { supabase } from '../src/lib/supabase';

async function check() {
  console.log('Verificando conexión con Supabase y existencia de tabla profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error o tabla no existente:', error.message);
  } else {
    console.log('¡Conexión exitosa! Tabla profiles existe. Datos obtenidos:', data);
  }
}

check().catch(console.error);
