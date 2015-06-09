---
title: "How to wait for a Java ExecutorService to finish gracefully"
layout: "post"
categories: [java, threading]
---

Java allows you to create your own managed thread pools using the Executor classes.  You can create simple [`ThreadPoolExecutor`s](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ThreadPoolExecutor.html) that run tasks immediately, or [`ScheduledThreadPoolExecutor`s](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ScheduledThreadPoolExecutor.html) that perform work after a delay.

One important point to be aware of is that you must always shut down your executors.  Once you start using an executor, its thread(s) will keep running forever, until you explicitly call `shutdown()`.  If you don't call `shutdown()`, your program will never terminate, since those threads will not stop.  (You can also avoid this using daemon threads, but that is generally not a good idea)  If you're using executors in a more controlled situation, such as in individual unit tests, you may want to shutdown more immediately, and with more control.

The inherent problem with shutting down an executor is what to do with unfinished tasks.  Executors provide three built-in methods to handle this: `shutdown()`, `awaitTermination()`, and `shutdownNow()`.   `shutdown()` will make the executor stop accepting new work, without affecting any already-submitted tasks.  `awaitTermination()` will wait for all existing tasks to finish, and will only return when the threads have been fully terminated (or if it timed out, or was interrupted).  Finally, `shutdownNow()` will stop accepting new tasks, and also attempt to gracefully cancel any currently-running tasks by calling [`Thread.interrupt()`](http://docs.oracle.com/javase/7/docs/api/java/lang/Thread.html#interrupt%28%29) (you still need to wait for the interrupted tasks to finish using `awaitTermination()`).  Thus, the typical code to shut down an executor is:

```java
executor.shutdown();
executor.awaitTermination(Long.MAX_VALUE, TimeUnit.DAYS);		// Can throw Interrupted
```

These methods are sufficient for most purposes.  However, one scenario they do not address is self-replicating tasks.  If your executor is currently running a task that will submit more tasks to the same executor before finishing (especially delayed tasks), you will probably want to recursively wait for all of those future tasks to complete before shutting down.  There is no simple way to do that.



Only one thread, scheduled:
```java
final AutoCloseable shutdownPool = new AutoCloseable() {
        private final Callable<ScheduledFuture<?>> getTaskSync = new Callable<ScheduledFuture<?>>() {
                @Override
                public ScheduledFuture<?> call() throws Exception {
                        return (ScheduledFuture<?>) pool.getQueue().peek();
                }
        };

        @Override
        public void close() throws Exception {
                // Wait for all tasks to finish, including any tasks that are
                // started after we start running.
                        
                // We can only grab tasks from the queue on the pool thread.
                // Otherwise, we can see an empty queue while the last task is
                // running on the thread, and end up shutting down the pool before
                // it has a chance to submit more work. By running this on directly
                // on the pool, we ensure that all other tasks are either already
                // finished executing or are still on the queue. This only works
                // because the pool has exactly one thread.

                ScheduledFuture<?> task;
                while (null != (task = pool.submit(getTaskSync).get())) {
                        task.get();
                }

                pool.shutdown();
                pool.awaitTermination(10, TimeUnit.DAYS);
        }
};
```

For multiple threads, submit one task per active thread and use a `Phaser` to wait for them to block all of the threads.  (what if it creates more?)

For raw `ThreadPoolExecutor`s, inherit it and override `afterExecute()` to be able to wait for the current task(s).