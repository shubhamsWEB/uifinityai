const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const DesignSystem = require('../../models/DesignSystem');
const Component = require('../../models/Component');

class DesignSystemStore {
  /**
   * Save a design system to the database
   * @param {Object} designSystem - The design system to save
   * @param {string} userId - The user ID
   * @param {string} [organizationId] - Optional organization ID
   * @returns {Promise<Object>} The saved design system
   */
  async saveDesignSystem(designSystem, userId, organizationId = null) {
    try {
      // Check if design system already exists for this user and Figma file
      let existingDS = await DesignSystem.findOne({
        figmaFileKey: designSystem.figmaFileKey,
        userId
      });
      
      if (existingDS) {
        // Update existing design system
        existingDS.name = designSystem.name || existingDS.name;
        existingDS.description = designSystem.description || existingDS.description;
        existingDS.tokens = designSystem.tokens;
        existingDS.version = this.incrementVersion(existingDS.version);
        existingDS.updatedAt = new Date();
        
        // Save updated components
        await this.updateComponents(existingDS, designSystem.components, designSystem.componentSets);
        
        await existingDS.save();
        return existingDS;
      } else {
        // Create new design system
        const newDS = new DesignSystem({
          name: designSystem.name || `Design System - ${new Date().toISOString()}`,
          description: designSystem.description || '',
          figmaFileKey: designSystem.figmaFileKey,
          userId,
          organizationId,
          tokens: designSystem.tokens,
          componentSets: designSystem.componentSets,
          version: '1.0.0',
        });
        
        // Save components and link them to the design system
        const savedComponents = await this.saveComponents(designSystem.components);
        newDS.components = savedComponents.map(comp => comp._id);
        
        await newDS.save();
        return newDS;
      }
    } catch (error) {
      console.error('Error saving design system:', error);
      throw error;
    }
  }
  
  /**
   * Get a design system by ID
   * @param {string} id - The design system ID
   * @returns {Promise<Object>} The design system
   */
  async getDesignSystemById(id) {
    try {
      return await DesignSystem.findById(id).populate('components');
    } catch (error) {
      console.error('Error getting design system:', error);
      throw error;
    }
  }
  
  /**
   * Get design systems for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of design systems
   */
  async getDesignSystemsByUser(userId) {
    try {
      return await DesignSystem.find({ userId }).populate('components');
    } catch (error) {
      console.error('Error getting design systems by user:', error);
      throw error;
    }
  }
  
  /**
   * Save components to the database
   * @param {Object} components - The components to save
   * @returns {Promise<Array>} The saved components
   */
  async saveComponents(components) {
    try {
      const savedComponents = [];
      
      for (const [id, componentData] of Object.entries(components)) {
        const component = new Component({
          figmaId: id,
          name: componentData.name,
          description: componentData.description || '',
          type: componentData.type || 'component',
          properties: componentData.properties || {},
          layout: componentData.layout || {},
          styles: componentData.styles || {},
          variantProperties: componentData.variantProperties,
          figmaKey: componentData.key,
          previewUrl: componentData.previewUrl || null
        });
        
        await component.save();
        savedComponents.push(component);
      }
      
      return savedComponents;
    } catch (error) {
      console.error('Error saving components:', error);
      throw error;
    }
  }
  
  /**
   * Update components for an existing design system
   * @param {Object} designSystem - The design system
   * @param {Object} components - The new components
   * @param {Object} componentSets - The new component sets
   * @returns {Promise<void>}
   */
  async updateComponents(designSystem, components, componentSets) {
    try {
      // Delete existing components
      await Component.deleteMany({
        _id: { $in: designSystem.components }
      });
      
      // Save new components
      const savedComponents = await this.saveComponents(components);
      designSystem.components = savedComponents.map(comp => comp._id);
      designSystem.componentSets = componentSets;
    } catch (error) {
      console.error('Error updating components:', error);
      throw error;
    }
  }
  
  /**
   * Delete a design system
   * @param {string} id - The design system ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteDesignSystem(id) {
    try {
      const designSystem = await DesignSystem.findById(id);
      
      if (!designSystem) {
        return false;
      }
      
      // Delete associated components
      await Component.deleteMany({
        _id: { $in: designSystem.components }
      });
      
      // Delete the design system
      await DesignSystem.deleteOne({ _id: id });
      
      return true;
    } catch (error) {
      console.error('Error deleting design system:', error);
      throw error;
    }
  }
  
  /**
   * Export design system as JSON
   * @param {string} id - The design system ID
   * @returns {Promise<Object>} The exported design system
   */
  async exportDesignSystem(id) {
    try {
      const designSystem = await DesignSystem.findById(id).populate('components');
      
      if (!designSystem) {
        throw new Error('Design system not found');
      }
      
      // Convert to plain object and format for export
      const exportData = designSystem.toObject();
      
      // Remove MongoDB specific fields
      delete exportData._id;
      delete exportData.__v;
      
      // Format components
      const componentsMap = {};
      for (const component of exportData.components) {
        delete component._id;
        delete component.__v;
        componentsMap[component.figmaId] = component;
      }
      
      exportData.components = componentsMap;
      
      return exportData;
    } catch (error) {
      console.error('Error exporting design system:', error);
      throw error;
    }
  }
  
  /**
   * Import design system from JSON
   * @param {Object} data - The design system data
   * @param {string} userId - The user ID
   * @param {string} [organizationId] - Optional organization ID
   * @returns {Promise<Object>} The imported design system
   */
  async importDesignSystem(data, userId, organizationId = null) {
    try {
      // Generate a new file key to avoid conflicts
      const newFileKey = `imported-${uuidv4()}`;
      
      // Prepare import data
      const importData = {
        ...data,
        figmaFileKey: newFileKey,
        userId,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to database
      return await this.saveDesignSystem(importData, userId, organizationId);
    } catch (error) {
      console.error('Error importing design system:', error);
      throw error;
    }
  }
  
  /**
   * Increment version number
   * @param {string} version - Current version (semver)
   * @returns {string} Incremented version
   */
  incrementVersion(version) {
    const parts = version.split('.');
    parts[2] = (parseInt(parts[2]) + 1).toString();
    return parts.join('.');
  }
}

module.exports = new DesignSystemStore();