"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Laporan, {
        foreignKey: "email",
        sourceKey: "email",
      });

      User.hasMany(models.Claim, {
        foreignKey: "email",
        sourceKey: "email",
      });
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "user"),
        allowNull: false,
         defaultValue: "user",
        validate: {
          isIn: {
            args: [["admin", "user"]],
            msg: "Role must be either 'admin' or 'user'",
          },
        },
      },
      no_telepon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alamat: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      foto: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "default.jpg",
      },

      // === Verifikasi email ===
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      emailVerifyToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emailVerifyTokenUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      // === Reset password ===
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordTokenUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      timestamps: true,
    }
  );

  return User;
};
