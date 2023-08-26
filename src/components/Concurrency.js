export async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = [];
    const executing = [];

    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const p = Promise.resolve().then(() => iteratorFn(item));
        ret.push(p);

        if (executing.push(p) > poolLimit) {
            executing.splice(executing.indexOf(await Promise.race(executing)), 1);
        }

        // Pause every 8-9 seconds for 1-2 seconds
        if (i % poolLimit === 0) {
            if (i !== 0) {
                console.log('Pausing for 1-2 seconds...');
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000)); // 1-2 seconds
            }
        }
    }

    await Promise.all(executing);
    return Promise.all(ret);
}
