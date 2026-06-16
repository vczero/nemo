const fs = require('fs');
const path = require('path');
const { RDBSource } = require('district-data/dist/cjs/index.js');

const source = new RDBSource({
  version: '2024',
  type: 'gcj02',
});

const outputFilePath = path.join(__dirname, 'china_administrative_tree.json');

async function processGeoData() {
    try {
        const geoArray = await source.getData({ level: 'city' });

        console.log('正在构建树形结构并排序...');
        const treeResult = buildTree(geoArray.features);

        console.log('正在写入本地文件...');
        fs.writeFileSync(outputFilePath, JSON.stringify(treeResult, null, 2), 'utf8');

        console.log(`处理完成！文件已保存至: ${outputFilePath}`);
    } catch (error) {
        console.error('处理数据时发生错误:', error.message);
    }
}

function buildTree(data) {
    const tree = [];
    const provinceMap = new Map();

    data.forEach(item => {
        const props = item.properties;
        if (!props) return;

        // 提取所需字段，统转字符串
        const provLabel = props.province;
        const provValue = props.province_adcode;
        const cityLabel = props.name;
        const cityValue = props.adcode;

        if (!provLabel || !provValue) return;

        // --- 1. 获取或创建省级节点 ---
        let provNode = provinceMap.get(provValue);
        if (!provNode) {
            // 注意：这里先不急着初始化 children，按需创建
            provNode = {
                label: provLabel,
                value: provValue,
                _cityMap: new Map() // 用于临时查找城市
            };
            provinceMap.set(provValue, provNode);
            tree.push(provNode);
        }

        // 如果这条数据本身就是代表整个省（极其少见的脏数据情况），直接跳过后续处理
        if (cityValue === provValue) return;

        // 只要能走到这里，说明该省下面肯定有内容，因此确保省级节点有 children
        if (!provNode.children) provNode.children = [];

        // --- 2. 核心判断：是否是省级直辖地区 ---
        provNode.children.push({
            label: cityLabel,
            value: cityValue
        });
    });

    // --- 3. 排序与清理辅助属性 ---

    // 3.1 对最外层的省级数组进行排序 (根据 province_adcode)
    tree.sort((a, b) => parseInt(a.value) - parseInt(b.value));

    tree.forEach(prov => {
        // 3.2 对每个省级节点下的市级数组进行排序 (根据 adcode)
        if (prov.children && prov.children.length > 0) {
            prov.children.sort((a, b) => parseInt(a.value) - parseInt(b.value));
        }

        // 3.3 删除用于辅助查找的内部属性 _cityMap
        delete prov._cityMap;
    });

    return tree;
}

// 运行程序
processGeoData();