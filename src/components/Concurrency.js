export async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = [];
    const executing = [];
    const totalCount = array.length;

    for (let i = 0; i < totalCount; i++) {
        const item = array[i];
        const p = Promise.resolve().then(() => iteratorFn(item, i, totalCount));
        ret.push(p);

        if (executing.push(p) > poolLimit) {
            executing.splice(executing.indexOf(await Promise.race(executing)), 1);
        }

        // After processing a batch of requests, pause for 4-8 seconds
        if (i % poolLimit === 0) {
            if (i !== 0) {
                console.log('Pausing for 1-3 seconds...');
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 3000)); // 4-8 seconds
            }
        }
    }

    await Promise.all(executing);
    return Promise.all(ret);
}
