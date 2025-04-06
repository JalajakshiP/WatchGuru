module.exports = (sequelize, DataTypes) => {
    const Friend = sequelize.define('Friend', {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      friendId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING, // 'pending', 'accepted', 'rejected'
        defaultValue: 'pending'
      }
    });
  
    Friend.associate = (models) => {
      Friend.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Friend.belongsTo(models.User, { foreignKey: 'friendId', as: 'friend' });
    };
  
    return Friend;
  };
  