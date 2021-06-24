const http = require("http");
const fs = require('fs')
const fse = require("fs-extra");
const path = require("path")
const multiparty = require("multiparty");
const server = http.createServer();
const UPLOAD_DIR = path.resolve(__dirname, "./", "target");
const resolvePost = req => {
  return new Promise((resolve, reject) => {
    let chunk = '';
    req.on('data', data => {
      chunk += data;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(chunk));
      } catch (err) {
        reject(err)
      }
    });
  })
}
const pipeStream = (path, writeStream) =>
  new Promise(resolve => {
    const readStream = fse.createReadStream(path);
    readStream.on("end", () => {
      fse.unlinkSync(path);
      resolve();
    });
    readStream.pipe(writeStream);
});

const mergeFile = async (filePath, filename, size) => {
  const chunkDir = path.resolve(UPLOAD_DIR, filename);
  const chunkPaths = await fse.readdir(chunkDir);
  
  chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1]);
  // console.log(chunkPaths);
  await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkDir, chunkPath),
        // 指定位置创建可写流
        fse.createWriteStream(filePath, {
          start: index * size,
          end: (index + 1) * size
        })
      )
    )
  )
  console.log('delete');
  fse.rmdirSync(chunkDir);
}
server.on("request", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  const { method, url } = req;
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    fs.readFile('./public/index.html', 'utf-8', function(err,data){
      if(err){
        throw err ;
      }
      res.end(data);
    })
  }
  if (url === '/createHash.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    fs.readFile('./public/createHash.js', 'utf-8', function(err,data){
      if(err){
        throw err ;
      }
      res.end(data);
    })
  }
  if (url === '/spark-md5.min.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    fs.readFile('./public/spark-md5.min.js', 'utf-8', function(err,data){
      if(err){
        throw err ;
      }
      res.end(data);
    })
  }
  if (url === '/api/upload') {
    const multipart = new multiparty.Form();
    multipart.parse(req, async (err, fields, files) => {
      if (err) {
        console.log(err);
        return;
      }
      const [chunk] = files.chunk;
      const [filename] = fields.filename;
      const [index] = fields.index;
      const [hash] = fields.hash;

      if (!fse.existsSync(UPLOAD_DIR)) {
        fse.mkdirSync(UPLOAD_DIR)
      }
      fse.moveSync(chunk.path, `${UPLOAD_DIR}/${hash}/${hash}-${index}`)
      console.log(`${UPLOAD_DIR}/${hash}/${hash}-${index}`);
      res.end('received')
    })
  }
  if (url == '/api/merge') {
    const data = await resolvePost(req)
    const { hash, filename, size } = data
    const filePath = path.resolve(UPLOAD_DIR, filename)
    await mergeFile(filePath, hash, size)
    res.end('ok')
  }
  if (url === '/api/verify') {
    const data = await resolvePost(req)
    const { filename, fileHash } = data
  }
});

server.listen(3000, () => console.log("3000 is listening"));

