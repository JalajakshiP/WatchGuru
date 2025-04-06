module.exports = (sequelize, DataTypes) => {
    const Rating = sequelize.define('Rating', {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      contentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: 0,
          max: 10
        }
      },
      review: {
        type: DataTypes.TEXT
      }
    });
  
    Rating.associate = (models) => {
      Rating.belongsTo(models.User, { foreignKey: 'userId' });
      Rating.belongsTo(models.Content, { foreignKey: 'contentId' });
    };
  
    return Rating;
  };
  