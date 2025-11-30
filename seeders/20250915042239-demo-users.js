  'use strict';
  const bcrypt = require('bcryptjs');

  module.exports = {
    async up (queryInterface, Sequelize) {
      return queryInterface.bulkInsert('Users', [
        {
          nama: 'Admin Sistem',
          email: 'admin@silapor.com',
          no_telepon: '081234567890',
          alamat: 'Padang, Indonesia',
          password: await bcrypt.hash('admin123', 10), 
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
          isVerified: 1
        },
        {
          nama: 'Test Admin',
          email: 'admin@example.com',
          no_telepon: '081234567891',
          alamat: 'Padang, Indonesia',
          password: await bcrypt.hash('Admin@123456', 10), 
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
          isVerified: 1
        },
        {
          nama: 'Test User',
          email: 'user@example.com',
          no_telepon: '081234567892',
          alamat: 'Padang, Indonesia',
          password: await bcrypt.hash('User@123456', 10), 
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
          isVerified: 1
        }
      ]);
    },

    async down (queryInterface, Sequelize) {
      return queryInterface.bulkDelete('Users', null, {});
    }
  };
