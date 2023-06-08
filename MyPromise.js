class MyPromise {
  // 构造方法
  constructor(executor) {
    this.initValue();
    this.initBind();
    try {
      // 执行传进来的函数
      executor(this.resolve, this.reject);
    } catch (e) {
      // 捕捉到错误直接执行reject
      this.reject(e);
    }
  }

  initBind() {
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);
  }

  initValue() {
    this.PromiseResult = null;
    this.PromiseState = "pending";
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];
  }

  resolve(value) {
    if (this.PromiseState !== "pending") return;

    this.PromiseState = "fulfilled";
    this.PromiseResult = value;

    // 依次调用所有的 onFulfilledCallbacks
    while (this.onFulfilledCallbacks.length > 0) {
      let callback = this.onFulfilledCallbacks.shift();
      callback(value);
    }
  }

  reject(reason) {
    if (this.PromiseState !== "pending") return;

    this.PromiseState = "rejected";
    this.PromiseResult = reason;

    // 依次调用所有的 onRejectedCallbacks
    while (this.onRejectedCallbacks.length > 0) {
      let callback = this.onRejectedCallbacks.shift();
      callback(reason);
    }
  }

  then(onFulfilled, onRejected) {
    // 如果onFulfilled不是函数，则赋一个默认函数
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          };

    // 返回新的Promise实例
    return new MyPromise((resolve, reject) => {
      // 包装onFulfilled回调函数，使其异步处理，并通过resolve方法传递结果
      const fulfilledHandler = (value) => {
        Promise.resolve().then(() => {
          try {
            const result = onFulfilled(value);
            result instanceof MyPromise
              ? result.then(resolve, reject)
              : resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      };

      // 包装onRejected回调函数，使其异步处理，并通过reject方法传递错误
      const rejectedHandler = (reason) => {
        Promise.resolve().then(() => {
          try {
            const result = onRejected(reason);
            result instanceof MyPromise
              ? result.then(resolve, reject)
              : resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      };
      if (this.PromiseState === "fulfilled") {
        fulfilledHandler(this.PromiseResult);
      } else if (this.PromiseState === "rejected") {
        rejectedHandler(this.PromiseResult);
      } else if (this.PromiseState === "pending") {
        this.onFulfilledCallbacks.push(fulfilledHandler);
        this.onRejectedCallbacks.push(rejectedHandler);
      }

      // setTimeout模拟
      // if (state === "fulfilled") {
      //   setTimeout(fulfilledHandler, 0);
      // } else if (state === "rejected") {
      //   setTimeout(rejectedHandler, 0);
      // } else if (state === "pending") {
      //   this.onFulfilledCallbacks.push(() => {
      //     setTimeout(fulfilledHandler, 0);
      //   });
      //   this.onRejectedCallbacks.push(() => {
      //     setTimeout(rejectedHandler, 0);
      //   });
      // }
    });
  }

  // 实现链式调用
  static resolve(value) {
    return new MyPromise((resolve) => {
      resolve(value);
    });
  }
  
  // 实现链式调用
  static reject(reason) {
    return new MyPromise((reject) => {
      reject(reason);
    });
  }

  static all(promises) {
    const result = [];
    let count = 0;
    return new MyPromise((resolve, reject) => {
      const addData = (index, value) => {
        result[index] = value;
        count++;
        if (count === promises.length) resolve(result);
      };
      promises.forEach((promise, index) => {
        if (promise instanceof MyPromise) {
          promise.then(
            (res) => {
              addData(index, res);
            },
            (err) => reject(err)
          );
        } else {
          addData(index, promise);
        }
      });
    });
  }

  static any(promises) {
    return new MyPromise((resolve, reject) => {
      let count = 0;
      promises.forEach((promise) => {
        if (!(promise instanceof MyPromise)) {
          promise = new MyPromise((resolve, reject) => {
            resolve(promise);
          });
        }
        promise.then(
          (val) => {
            resolve(val);
          },
          (err) => {
            count++;
            if (count === promises.length) {
              reject(new AggregateError("All promises were rejected"));
            }
          }
        );
      });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach((promise) => {
        if (promise instanceof MyPromise) {
          promise.then(
            (res) => {
              resolve(res);
            },
            (err) => {
              reject(err);
            }
          );
        } else {
          resolve(promise);
        }
      });
    });
  }

  static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      const res = [];
      let count = 0;
      const addData = (status, value, i) => {
        res[i] = {
          status,
          value,
        };
        count++;
        if (count === promises.length) {
          resolve(res);
        }
      };
      promises.forEach((promise, i) => {
        if (promise instanceof MyPromise) {
          promise.then(
            (res) => {
              addData("fulfilled", res, i);
            },
            (err) => {
              addData("rejected", err, i);
            }
          );
        } else {
          addData("fulfilled", promise, i);
        }
      });
    });
  }
}
