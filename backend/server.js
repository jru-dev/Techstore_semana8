const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100
});
app.use('/api/', limiter);

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const productRoutes = require('./routes/product.routes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/products', productRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});