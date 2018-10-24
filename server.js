import { Server } from "ws";
import createObserver, { expect, isDeepMatching } from "./Observer";

const WS = new Server({ port: 8080 });
const connections = [];

WS.on("connection", connection => {
  connections.push({
    socket: connections,
    send(data) {
      try {
        connection.send(JSON.stringify(data));
      } catch (e) {}
    }
  });
  console.log(`Added ${connections.length} `);

  connection.on("message", message => {});

  connection.on("error", error => {
    !(connection.CLOSED || connection.CLOSING) && connection.close();
  });

  connection.on("close", () => {
    connections.splice(
      connections.findIndex(({ socket }) => socket === connection),
      1
    );
    console.log(`Removed ${connections.length} `);
  });
});

console.log("Start");

console.log(
  isDeepMatching(
    {
      name: "11",
      age: 113,
      run: 11
    },
    {
      name: expect.to.be.string,
      age: expect.to.be.number,
      run: expect.to.be.function
    }
  )
);

export default {
  when(action) {
    return createObserver(action);
  }
};
