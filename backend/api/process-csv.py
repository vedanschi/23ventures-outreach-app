from ..app import process_csv  # import the function from your existing code
def handler(request):
    return process_csv(request)