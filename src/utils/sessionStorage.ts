import type {RSA} from "otb-toolkit/src/types";

class SStorageConstructor {
  key: string

  constructor(key: any) {
    this.key = key
  }

  setter(data: RSA | RSA[] | string | number) {
    if (data) sessionStorage.setItem(this.key, JSON.stringify(data))
  }

  getter() {
    if (sessionStorage.getItem(this.key)) {
      return JSON.parse(sessionStorage.getItem(this.key) as string)
    }
  }

  remove() {
    return sessionStorage.removeItem(this.key)
  }
}

export const SStorage = {
  token: new SStorageConstructor("token"),
  schoolList: new SStorageConstructor("schoolList"),
  sid: new SStorageConstructor("sid"),
  new: (key: string) => new SStorageConstructor(key)
}
