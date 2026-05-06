const initDatabase = require('./initDB');

initDatabase().then(() => {
    console.log('Inicialización completada');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});