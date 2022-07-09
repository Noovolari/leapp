
module.exports = {

  up: async (queryInterface, Sequelize) => {

    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    await queryInterface.createTable('author', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      name: {
        field: 'name',
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
        unique: true
      },
      email: {
        field: 'email',
        type: Sequelize.DataTypes.TEXT,
        allowNull: true
      }
    });

    await queryInterface.createTable('status', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      name: {
        field: 'name',
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      }
    });

    await queryInterface.createTable('plugin', {
      pluginName: {
        field: 'plugin_name',
        type: Sequelize.DataTypes.TEXT,
        primaryKey: true,
        allowNull: false
      },
      authorId: {
        field: 'author_id',
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'author',
          key: 'id'
        },
      },
      description: {
        field: 'description',
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      tags: {
        field: 'tags',
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      uri: {
        field: 'uri',
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      signature: {
        field: 'signature',
        type: Sequelize.DataTypes.TEXT,
        allowNull: true
      },
      hash: {
        field: 'hash',
        type: Sequelize.DataTypes.TEXT,
        allowNull: true
      },
      statusId: {
        field: 'status_id',
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'status',
          key: 'id'
        },
      },
      createdAt: {
        field: 'created_at',
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        field: 'updated_at',
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("plugin");
    await queryInterface.dropTable("author");
    await queryInterface.dropTable("status");
  }
};
