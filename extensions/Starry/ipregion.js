const starrycbz_ipregion_picture = "略";

const starrycbz_ipregion_icon = "略";

const starrycbz_ipregion_extensionId = "StarrycbzIPRegion";

/** @typedef {string|number|boolean} SCarg 来自Scratch圆形框的参数，虽然这个框可能只能输入数字，但是可以放入变量，因此有可能获得数字、布尔和文本（极端情况下还有 null 或 undefined，需要同时处理 */

class StarrycbzIPRegion {
    constructor(runtime) {
        this.runtime = runtime;
        /** 当前获取到的归属地信息 */
        this.Starrycbz_ipregion_location = "未知";
        /** 当前使用的API类型 */
        this.Starrycbz_ipregion_apiType = "高德";
        /** 是否正在获取中 */
        this.Starrycbz_ipregion_isFetching = false;
        /** 上次获取时间 */
        this.Starrycbz_ipregion_lastFetchTime = 0;
        /** 缓存时间（毫秒） */
        this.Starrycbz_ipregion_cacheTime = 60000; // 默认1分钟缓存

        this._formatMessage = runtime.getFormatMessage({
            "zh-cn": {
                "StarrycbzIPRegion.name": "归属地X",
                "StarrycbzIPRegion.apis": "API设置",
                "StarrycbzIPRegion.location": "位置信息",
                "StarrycbzIPRegion.get_location": "刷新当前IP归属地",
                "StarrycbzIPRegion.current_location": "当前IP归属地",
                "StarrycbzIPRegion.set_cache_time": "设置缓存时间为[time]秒",
                "StarrycbzIPRegion.api.gaode": "高德",
                "StarrycbzIPRegion.docs": "📖扩展教程"
            },
            en: {
                "StarrycbzIPRegion.name": "IP Region X",
                "StarrycbzIPRegion.apis": "API Settings",
                "StarrycbzIPRegion.location": "Location Info",
                "StarrycbzIPRegion.get_location": "refresh current IP region",
                "StarrycbzIPRegion.current_location": "current IP region",
                "StarrycbzIPRegion.set_cache_time": "set cache time to [time] seconds",
                "StarrycbzIPRegion.api.gaode": "Gaode",
                "StarrycbzIPRegion.docs": "📖 Tutorial"
            }
        })
    }

    /**
     * 翻译
     * @param {string} id
     * @return {string}
     */
    formatMessage(id) {
        return this._formatMessage({
            id,
            default: id,
            description: id
        });
    }

    getInfo() {
        return {
            id: starrycbz_ipregion_extensionId, // 拓展id
            name: this.formatMessage("StarrycbzIPRegion.name"), // 拓展名
            blockIconURI: starrycbz_ipregion_icon,
            menuIconURI: starrycbz_ipregion_icon,
            color1: "#4C97FF",
            color2: "#3373CC",
            blocks: [
                {
                    blockType: "button",
                    text: this.formatMessage('StarrycbzIPRegion.docs'),
                    onClick: this.docs,
                },
                "---" + this.formatMessage("StarrycbzIPRegion.location"),
                {
                    opcode: "getLocation",
                    blockType: "command",
                    text: this.formatMessage("StarrycbzIPRegion.get_location"),
                    arguments: {},
                },

                {
                    opcode: "currentLocation",
                    blockType: "reporter",
                    text: this.formatMessage("StarrycbzIPRegion.current_location"),
                    arguments: {},
                },
                "---" + this.formatMessage("StarrycbzIPRegion.apis"),
                {
                    opcode: "setCacheTime",
                    blockType: "command",
                    text: this.formatMessage("StarrycbzIPRegion.set_cache_time"),
                    arguments: {
                        time: {
                            type: "number",
                            defaultValue: '60',
                        }
                    },
                },
            ],
            menus: {
                api: [
                    {
                        text: this.formatMessage('StarrycbzIPRegion.api.gaode'),
                        value: '高德'
                    }
                ],
            },
        };
    }

    /** 打开教程 */
    docs() {
        let a = document.createElement('a');
        a.href = "https://github.com/Starry-cbz/"; // 可以替换为实际的教程链接
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        a.click();
    }

    /**
     * 使用默认API获取归属地
     * @return {Promise<void>}
     */
    async getLocation() {
        await this._fetchLocation(this.Starrycbz_ipregion_apiType);
    }



    /**
     * 获取当前归属地
     * @return {string}
     */
    currentLocation() {
        return this.Starrycbz_ipregion_location;
    }

    /**
     * 设置缓存时间
     * @param {object} args
     * @param {SCarg} args.time 缓存时间（秒）
     * @return {void}
     */
    setCacheTime(args) {
        const time = Number(args.time);
        if (!isNaN(time) && time >= 0) {
            this.Starrycbz_ipregion_cacheTime = time * 1000; // 转换为毫秒
        }
    }

    /**
     * 内部方法：获取归属地
     * @param {string} apiType API类型
     * @return {Promise<void>}
     * @private
     */
    async _fetchLocation(apiType) {
        // 检查是否正在获取中
        if (this.Starrycbz_ipregion_isFetching) {
            return;
        }

        // 检查缓存是否有效
        const now = Date.now();
        if (now - this.Starrycbz_ipregion_lastFetchTime < this.Starrycbz_ipregion_cacheTime) {
            return;
        }

        this.Starrycbz_ipregion_isFetching = true;
        this.Starrycbz_ipregion_apiType = apiType;

        try {
            let location = "未知";

            switch (apiType) {
                case "高德":
                    location = await this._fetchGaodeLocation();
                    break;
                case "IPAPI":
                    location = await this._fetchIPAPILocation();
                    break;
                case "百度":
                    location = await this._fetchBaiduLocation();
                    break;
                default:
                    location = await this._fetchGaodeLocation();
                    break;
            }

            this.Starrycbz_ipregion_location = location;
            this.Starrycbz_ipregion_lastFetchTime = now;
        } catch (error) {
            console.error("获取归属地失败:", error);
        } finally {
            this.Starrycbz_ipregion_isFetching = false;
        }
    }

    /**
     * 使用高德API获取归属地
     * @return {Promise<string>}
     * @private
     */
    async _fetchGaodeLocation() {
        try {
            const response = await fetch("https://restapi.amap.com/v3/ip?key=0113a13c88697dcea6a445584d535837");
            const data = await response.json();
            
            if (data && data.status === "1" && data.province) {
                let location = data.province;
                if (data.city && data.city !== data.province) {
                    location += data.city;
                }
                return location;
            }
            return "未知";
        } catch (error) {
            console.error("高德API获取归属地失败:", error);
            return "未知";
        }
    }

    /**
     * 使用IPAPI获取归属地
     * @return {Promise<string>}
     * @private
     */

}

window.tempExt = {
    Extension: StarrycbzIPRegion,
    info: {
        name: "StarrycbzIPRegion.name",
        description: "StarrycbzIPRegion.descp",
        extensionId: starrycbz_ipregion_extensionId,
        iconURL: starrycbz_ipregion_picture,
        insetIconURL: starrycbz_ipregion_icon,
        featured: true,
        disabled: false,
        collaborator: "Starry-cbz@GIthub"
    },
    l10n: {
        "zh-cn": {
            "StarrycbzIPRegion.name": "归属地X",
            "StarrycbzIPRegion.descp": "简单高效的获取用户归属地"
        },
        en: {
            "StarrycbzIPRegion.name": "IP Region X",
            "StarrycbzIPRegion.descp": "Simple and efficient way to get user's IP region"
        }
    }
};
