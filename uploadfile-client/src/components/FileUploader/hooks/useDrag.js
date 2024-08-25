import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { MAX_FILE_SIZE } from "../enums";

function useDrag(containerRef) {
  const [selectedFile, setSelectedFile] = useState(null); // 上传文件的内容
  const [filePreview, setFilePreview] = useState({}); // 预览文件的信息
  const paramsRef = useRef();

  paramsRef.current = {
    ...paramsRef.current,
    containerRef,
    handleDrop,
  };

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;
    checkFile(files);
  }

  function checkFile(files) {
    const file = files[0];
    if (!file) {
      message.error("请选择文件");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      message.error("文件大小不能超过2G");
      return;
    }

    // 只能上传图片和视频
    if (!(file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      message.error("文件类型必须是图片或视频");
      return;
    }

    setSelectedFile(file);
  }

  useEffect(() => {
    if (selectedFile) {
      // URL.createObjectURL()处理后生成了一个临时的链接，直接赋值给src就行。
      const objectURL = URL.createObjectURL(selectedFile);
      setFilePreview({
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        url: objectURL,
      });

      // 异步读取指定的Blob中的内容，一旦完成，会返回一个data: URL格式的字符串以表示所读取文件的内容。
      // const reader = new FileReader();
      // reader.readAsDataURL(selectedFile);
      // reader.onload = () => {
      //   setFilePreview({
      //     name: selectedFile.name,
      //     type: selectedFile.type,
      //     size: selectedFile.size,
      //     url: reader.result,
      //   });
      // };

      return () => {
        // revokeObjectURL()方法会释放一个之前通过URL.createObjectURL()创建的URL对象。
        URL.revokeObjectURL(objectURL);
      };
    }
  }, [selectedFile]);

  useEffect(() => {
    const { containerRef, handleDrop } = paramsRef.current;
    const contaienr = containerRef.current;
    contaienr.addEventListener("dragenter", handleDrag); // 拖拽首次进入某个控件
    contaienr.addEventListener("dragover", handleDrag); // 拖拽进入某个控件
    contaienr.addEventListener("drop", handleDrop); // 放置
    contaienr.addEventListener("dragleave", handleDrag); // 拖拽离开某个控件

    return () => {
      contaienr.removeEventListener("dropenter", handleDrag);
      contaienr.removeEventListener("dragover", handleDrag);
      contaienr.removeEventListener("drop", handleDrop);
      contaienr.removeEventListener("dragleave", handleDrag);
    };
  }, []);

  return { selectedFile, filePreview };
}

export default useDrag;
