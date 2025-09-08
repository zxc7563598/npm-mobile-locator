<template>
    <div class="container">
        <div class="card">
            <h1>📱 手机号信息匹配工具</h1>
            <p class="subtitle">1. 点下载示例 CSV 文件。示例只包含一列“手机号”。</p>
            <p class="subtitle">2. 在 第一列 第二行 开始填写你要查询的手机号，每行一个，不要去动第一行</p>
            <p class="subtitle">3. 上传填写好的 CSV，系统会匹配每个手机号的省份、城市和运营商。</p>
            <p class="subtitle">4. 结果保持上传顺序，即使原文件有其他列也可按顺序匹配。</p>
            <p class="subtitle">5. 下载结果 CSV，将匹配信息拷贝回原文件即可。</p>
            <button class="btn primary" @click="downloadExample" :disabled="loading">下载 CSV 示例</button>
            <div class="upload">
                <label for="file-upload" class="btn secondary" :class="{ disabled: loading }">
                    {{ loading ? `处理中... (${processedCount} 条)` : '上传 CSV 文件' }}
                </label>
                <input id="file-upload" type="file" @change="handleFileUpload" accept=".csv" :disabled="loading" />
            </div>
            <button v-if="resultReady" class="btn success" @click="downloadResult">下载匹配结果</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Papa from "papaparse";

const loading = ref(false);
const processedCount = ref(0);
const resultReady = ref(false);
const resultCsv = ref("");
let phoneMap = null;

// 读取 JSON 数据并转为 Map
onMounted(async () => {
    const res = await fetch("./phone.json");
    const data = await res.json();
    phoneMap = new Map(Object.entries(data));
});

// 下载 CSV 示例
const downloadExample = () => {
    const csvContent = "手机号\n13000000000\n13000010000\n13000020000";
    // 加 BOM 防止 Windows Excel 中文乱码
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "手机号上传示例.csv";
    a.click();
};

// 处理上传 CSV (流式解析 + 拼接结果 + 显示进度)
const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    loading.value = true;
    processedCount.value = 0;
    resultReady.value = false;
    let csvOutput = "手机号,省,市,运营商\n";
    let isFirstChunk = true;
    Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        chunkSize: 1024 * 1024,
        chunk: (results) => {
            let data = results.data;
            // 只在第一次 chunk 时跳过表头
            if (isFirstChunk) {
                data = data.slice(1);
                isFirstChunk = false;
            }
            const lines = data.map((row) => {
                const phoneVal = row[0];
                const prefix = phoneVal?.slice(0, 7);
                const info = phoneMap?.get(prefix) || {};
                return `${phoneVal},${info.province || ""},${info.city || ""},${info.isp || ""}`;
            });
            csvOutput += lines.join("\n") + "\n";
            processedCount.value += data.length;
        },
        complete: () => {
            resultCsv.value = "\uFEFF" + csvOutput;
            resultReady.value = true;
            loading.value = false;
            alert(`✅ 匹配完成，共处理 ${processedCount.value} 条数据！`);
        },
        error: (err) => {
            loading.value = false;
            alert("❌ CSV 处理失败：" + err.message);
        }
    });
};

// 下载匹配结果 CSV
const downloadResult = () => {
    const blob = new Blob(["\uFEFF" + resultCsv.value], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "匹配结果.csv";
    a.click();
    // 下载后重置状态
    processedCount.value = 0;
    resultReady.value = false;
    resultCsv.value = "";
    document.getElementById("file-upload").value = null; // 清空文件选择
};
</script>

<style scoped>
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f5f7fa;
    font-family: "Helvetica Neue", Arial, sans-serif;
}

.card {
    background: white;
    padding: 40px 30px;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    text-align: center;
    width: 100%;
    max-width: 500px;
}

.card h1 {
    font-size: 24px;
    margin-bottom: 10px;
    color: #2c3e50;
}

.subtitle {
    font-size: 14px;
    margin-top: 5px;
    color: #7f8c8d;
    text-align: left;
}

.btn {
    display: inline-block;
    padding: 10px 20px;
    margin: 12px 6px;
    font-size: 14px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.2s ease-in-out;
    border: none;
}

.btn.primary {
    margin-top: 30px;
    background: #3498db;
    color: white;
}

.btn.primary:hover {
    background: #2980b9;
}

.btn.secondary {
    background: #ecf0f1;
    color: #34495e;
}

.btn.secondary:hover {
    background: #d0d7de;
}

.btn.success {
    background: #2ecc71;
    color: white;
}

.btn.success:hover {
    background: #27ae60;
}

.upload input[type="file"] {
    display: none;
}

.disabled {
    opacity: 0.6;
    pointer-events: none;
}
</style>
