// Persistent Data Manager with GitHub Storage
// 持久化数据管理器（GitHub存储）

import { githubStorage } from './github-storage'
import { promises as fs } from 'fs'
import path from 'path'

class PersistentDataManager {
  async loadData<T>(fileName: string, defaultData?: T): Promise<T | null> {
    try {
      // Try loading from GitHub first (production)
      const githubData = await githubStorage.loadData(fileName)
      if (githubData) {
        console.log(`${fileName} loaded from GitHub`)
        return githubData as T
      }

      // Fallback to local file system (development)
      const filePath = path.join(process.cwd(), 'data', fileName)
      const fileContent = await fs.readFile(filePath, 'utf8')
      const localData = JSON.parse(fileContent)
      console.log(`${fileName} loaded from local file:`, filePath)
      return localData as T
    } catch (error) {
      console.log(`Failed to load ${fileName}, using default:`, error)
      return defaultData || null
    }
  }

  async saveData<T>(fileName: string, data: T): Promise<boolean> {
    try {
      // Try saving to GitHub first (production)
      const success = await githubStorage.saveData(fileName, data)
      if (success) {
        console.log(`${fileName} saved to GitHub successfully`)
        return true
      }

      // Fallback to local file system (development)
      const filePath = path.join(process.cwd(), 'data', fileName)
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
      console.log(`${fileName} saved to local file:`, filePath)
      return true
    } catch (error) {
      console.error(`Failed to save ${fileName}:`, error)
      return false
    }
  }

  isProductionMode(): boolean {
    return process.env.NODE_ENV === 'production' && githubStorage.isConfigured()
  }

  getStorageInfo(): { mode: string; configured: boolean } {
    if (this.isProductionMode()) {
      return { mode: 'GitHub', configured: true }
    }
    return { mode: 'Local File System', configured: true }
  }
}

export const persistentDataManager = new PersistentDataManager()
export default PersistentDataManager