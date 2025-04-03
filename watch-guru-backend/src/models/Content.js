const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Content = sequelize.define("Content", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM("movie", "show", "anime"), allowNull: false },
  releaseDate: { type: DataTypes.DATE, allowNull: true },
  genre: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  posterUrl: { type: DataTypes.TEXT, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  ratingAvg: { type: DataTypes.FLOAT, defaultValue: 0.0 },
}, { timestamps: true });

module.exports = Content;
