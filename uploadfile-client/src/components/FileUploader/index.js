import styles from "./index.module.css";
import { InboxOutlined } from "@ant-design/icons";
import { useRef } from "react";
import { Button, message } from "antd";
import useDrag from "./hooks/useDrag";
import { CHUNK_SIZE } from "./enums";
import axiosInstance from "../../request/axiosInstance";

function FileUploader(props) {
  const containerRef = useRef();
  const { selectedFile, filePreview } = useDrag(containerRef);

  async function handleUpload() {
    if (!selectedFile) {
      message.error("请先选择文件");
    }

    const fileName = await getFileName(selectedFile);
    await uploadFile(fileName, selectedFile);
  }

  async function getFileName(file) {
    // 计算文件hash
    const fileHash = await calculateFileHash(file);
    // 获取文件扩展名
    const fileExtension = file.name.split(".").pop();
    return `${fileHash}.${fileExtension}`;
  }

  /**
   * 计算文件hash字符串
   * @param {*} file
   * @returns
   */
  async function calculateFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    // 获取hashBuffer，crypto是浏览器自带的转hash方法，SHA256是一种hash算法
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    // Hex是16进制
    return bufferToHexString(hashBuffer);
  }

  /**
   * buffer转成16进制的字符串
   * @param {*} buffer
   * @returns
   */
  function bufferToHexString(buffer) {
    // U无符号的，int整形，8位数组
    const hexArray = Array.from(new Uint8Array(buffer));
    // padStart只有一位，前面补0
    return hexArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  /**
   * 切片上传大文件
   * @param {*} fileName
   * @param {*} file
   */
  async function uploadFile(fileName, file) {
    // 大文件切片
    // const chunks = sliceFile(file, CHUNK_SIZE);
    const chunks = createFileChunks(file, fileName);
    // 实现并行上传
    const requests = chunks.map(({ chunk, chunkFileName }) => {
      return createRequest(fileName, chunk, chunkFileName);
    });

    try {
      // 并行上传每个分片
      await Promise.all(requests);
      // 等全部分片上传完了，向服务器发送一个合并文件的请求
      await axiosInstance.get(`/merge/${fileName}`);
      message.success("上传成功");
    } catch (error) {
      console.log(error);
    }
  }

  function createRequest(fileName, chunk, chunkFileName) {
    return axiosInstance.post(`/upload/${fileName}`, chunk, {
      headers: {
        "COntent-Type": "application/octet-stream", // 文件流
      },
      params: {
        chunkFileName,
      },
    });
  }

  // function sliceFile(file, chunkSize) {
  //   const chunks = [];
  //   let start = 0;
  //   while (start < file.size) {
  //     chunks.push(file.slice(start, start + chunkSize));
  //     start += chunkSize;
  //   }
  //   return chunks;
  // }

  function createFileChunks(file, fileName) {
    const chunks = [];
    // 计算要切多少片
    const count = Math.ceil(file.size / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      const chunk = file.slice(i * CHUNK_SIZE, i + 1 * CHUNK_SIZE);
      chunks.push({
        chunk,
        chunkFileName: `${fileName}-${i}`,
      });
    }
    return chunks;
  }

  function renderPreview(filePreview) {
    const { url, type, name } = filePreview;
    if (url) {
      if (type.startsWith("image/")) {
        return <img src={url} alt={name} />;
      } else if (type.startsWith("video/")) {
        return <video src={url} alt={name} controls />;
      } else {
        return <div>暂不支持该文件类型</div>;
      }
    } else {
      return <InboxOutlined />;
    }
  }

  function renderButton() {
    return <Button onClick={handleUpload}>上传</Button>;
  }

  return (
    <>
      <div ref={containerRef} className={styles.container}>
        {renderPreview(filePreview)}
      </div>
      {renderButton()}
    </>
  );
}

export default FileUploader;
