import { supabase } from '../src/lib/supabase';

async function fixMariano() {
  console.log('1. Intentando iniciar sesión como mariano@rafaelanoticias.com...');
  let marianoId = '';
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'mariano@rafaelanoticias.com',
      password: 'password123'
    });
    if (error) {
      console.error('Error al iniciar sesión como Mariano:', error.message);
    } else if (data.user) {
      marianoId = data.user.id;
      console.log('Sesión iniciada. Mariano UUID:', marianoId);
    }
  } catch (err: any) {
    console.error('Excepción al iniciar sesión como Mariano:', err.message || err);
  }

  if (!marianoId) {
    console.log('No se pudo obtener el UUID de Mariano de auth.');
    return;
  }

  console.log('2. Iniciando sesión como admin@rafaelanoticias.com para insertar perfil...');
  try {
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@rafaelanoticias.com',
      password: 'password123'
    });
    if (adminError) {
      console.error('Error al iniciar sesión como Admin:', adminError.message);
      return;
    }
    console.log('Admin logueado correctamente.');

    // Insertar perfil de Mariano
    console.log('3. Creando fila de perfil para Mariano...');
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: marianoId,
        nombre: 'Mariano Redactor',
        email: 'mariano@rafaelanoticias.com',
        rol: 'editor',
        activo: true
      })
      .select();

    if (insertError) {
      console.error('Error al insertar perfil de Mariano:', insertError.message);
    } else {
      console.log('Perfil de Mariano insertado con éxito:', insertData);
    }
  } catch (err: any) {
    console.error('Excepción en el flujo de administrador:', err.message || err);
  } finally {
    // Cerrar sesión
    await supabase.auth.signOut();
  }
}

fixMariano();
